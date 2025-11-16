from loguru import logger
from typing import Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from config.models import Model, get_model
from decode import decode_json
from .models import Roadmap, RoadmapNode

str_parser = StrOutputParser()

ROADMAP_GENERATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert learning path designer for programming topics.

Your task is to create a comprehensive, hierarchical learning roadmap for: {topic}

Generate a structured learning path with:
- 3-5 main categories (e.g., Fundamentals, Core Concepts, Advanced Topics)
- 3-6 subtopics per category
- Clear difficulty progression (beginner → intermediate → advanced)
- Each node must have:
  * title: Concise name (2-5 words)
  * description: Brief explanation of what you'll learn (1-2 sentences, max 150 characters)
  * difficulty: 0 (beginner), 1 (intermediate), or 2 (advanced)

Important guidelines:
1. Keep the tree 2-3 levels deep maximum
2. Order topics logically (prerequisites first)
3. Make descriptions concise and actionable
4. Focus on practical, essential knowledge
5. Ensure smooth learning progression

Return ONLY valid JSON in this exact format:
{{
  "title": "Master {topic}",
  "description": "Complete learning path for {topic}",
  "categories": [
    {{
      "title": "Category Name",
      "description": "What this category covers",
      "difficulty": 0,
      "topics": [
        {{
          "title": "Topic Name",
          "description": "What you'll learn here",
          "difficulty": 0
        }}
      ]
    }}
  ]
}}

Ensure the JSON is valid and properly formatted."""),
    ("human", "Generate a comprehensive learning roadmap for: {topic}")
])


class RoadmapGenerator:
    """Generates AI-powered learning roadmaps"""

    def __init__(self, topic: str, model_name: str = Model.GPT_4O_MINI.value):
        self.topic = topic
        self.model_name = model_name

    async def generate(self) -> dict:
        """
        Generate a complete roadmap structure using AI.

        Returns:
            dict: Roadmap structure with categories and topics

        Raises:
            ValueError: If generation or parsing fails
        """
        try:
            llm = get_model(self.model_name)
            chain = ROADMAP_GENERATION_PROMPT | llm | str_parser

            response = await chain.ainvoke({"topic": self.topic})

            logger.info(f"AI response for roadmap generation: {response[:200]}...")

            # Parse the JSON response
            roadmap_data = decode_json(response.strip())

            # Validate structure
            if not self._validate_structure(roadmap_data):
                raise ValueError("Invalid roadmap structure generated")

            return roadmap_data

        except Exception as e:
            logger.error(f"Error generating roadmap: {e}")
            raise ValueError(f"Failed to generate roadmap: {str(e)}")

    def _validate_structure(self, data: dict) -> bool:
        """
        Validate the generated roadmap structure.

        Args:
            data: The roadmap data to validate

        Returns:
            bool: True if valid, False otherwise
        """
        if not isinstance(data, dict):
            logger.error("Roadmap data is not a dictionary")
            return False

        required_fields = ["title", "categories"]
        if not all(field in data for field in required_fields):
            logger.error(f"Missing required fields. Got: {data.keys()}")
            return False

        if not isinstance(data["categories"], list) or len(data["categories"]) == 0:
            logger.error("Categories must be a non-empty list")
            return False

        # Validate each category
        for category in data["categories"]:
            if not isinstance(category, dict):
                logger.error(f"Invalid category structure: {category}")
                return False

            if not all(key in category for key in ["title", "description"]):
                logger.error(f"Category missing required fields: {category}")
                return False

            # Validate topics in category
            if "topics" in category:
                if not isinstance(category["topics"], list):
                    logger.error(f"Topics must be a list: {category['topics']}")
                    return False

                for topic in category["topics"]:
                    if not isinstance(topic, dict):
                        logger.error(f"Invalid topic structure: {topic}")
                        return False

                    if not all(key in topic for key in ["title", "description"]):
                        logger.error(f"Topic missing required fields: {topic}")
                        return False

        return True

    async def create_roadmap_with_nodes(self) -> tuple[Roadmap, list[RoadmapNode]]:
        """
        Generate roadmap and create database records.

        Returns:
            tuple: (Roadmap, list of RoadmapNodes)

        Raises:
            ValueError: If generation fails
        """
        # Generate roadmap structure
        roadmap_data = await self.generate()

        # Create roadmap
        roadmap = await Roadmap.create(
            title=roadmap_data.get("title", f"Master {self.topic}"),
            description=roadmap_data.get("description", f"Complete learning path for {self.topic}")
        )

        # Create nodes
        nodes = await self._create_nodes_from_data(
            roadmap.public_id,
            roadmap_data["categories"]
        )

        # Update roadmap total_nodes count
        roadmap.total_nodes = len(nodes)

        return roadmap, nodes

    async def _create_nodes_from_data(
        self,
        roadmap_id: str,
        categories: list[dict]
    ) -> list[RoadmapNode]:
        """
        Create RoadmapNode records from generated data.

        Args:
            roadmap_id: The roadmap public ID
            categories: List of category data

        Returns:
            list: Created RoadmapNode instances
        """
        all_nodes = []
        position = 0

        for category in categories:
            # Create category node (parent)
            category_node = await RoadmapNode.create(
                roadmap_id=roadmap_id,
                title=category["title"],
                description=category["description"],
                difficulty=category.get("difficulty"),
                position=position
            )
            all_nodes.append(category_node)
            position += 1

            # Create child topic nodes
            if "topics" in category:
                for topic_data in category["topics"]:
                    topic_node = await RoadmapNode.create(
                        roadmap_id=roadmap_id,
                        title=topic_data["title"],
                        description=topic_data["description"],
                        parent_node_id=category_node.public_id,
                        difficulty=topic_data.get("difficulty"),
                        position=position
                    )
                    all_nodes.append(topic_node)
                    position += 1

        return all_nodes


async def generate_roadmap(topic: str, model_name: str = Model.GPT_4O_MINI.value) -> tuple[Roadmap, list[RoadmapNode]]:
    """
    Convenience function to generate a complete roadmap.

    Args:
        topic: The topic to create a roadmap for
        model_name: The AI model to use

    Returns:
        tuple: (Roadmap, list of RoadmapNodes)
    """
    generator = RoadmapGenerator(topic, model_name)
    return await generator.create_roadmap_with_nodes()
