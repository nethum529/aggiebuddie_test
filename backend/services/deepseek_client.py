"""
DeepSeek API Client

Handles communication with DeepSeek API for intelligent activity suggestions.
Uses OpenAI-compatible format for easy integration.
"""

import os
import json
import logging
from typing import List, Dict, Optional

# Optional import for requests (graceful degradation)
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    requests = None

logger = logging.getLogger(__name__)

DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
DEEPSEEK_MODEL = os.environ.get('DEEPSEEK_MODEL', 'deepseek-chat')


class DeepSeekClient:
    """Client for DeepSeek API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize DeepSeek client
        
        Args:
            api_key: DeepSeek API key (defaults to DEEPSEEK_API_KEY env var)
        """
        self.api_key = api_key or DEEPSEEK_API_KEY
        self.api_url = DEEPSEEK_API_URL
        self.model = DEEPSEEK_MODEL
        
        if not REQUESTS_AVAILABLE:
            logger.warning(
                "requests module not installed. "
                "DeepSeek API will be unavailable. "
                "Install with: pip install requests"
            )
        
        if not self.api_key:
            logger.warning("DeepSeek API key not set. API calls will fail.")
    
    def generate_suggestions(
        self,
        free_time_blocks: List[Dict],
        activity_type: str,
        duration_minutes: int,
        available_locations: List[Dict]
    ) -> Dict:
        """
        Generate activity suggestions using DeepSeek AI
        
        Args:
            free_time_blocks: List of free time blocks
            activity_type: Type of activity (gym, dining, study)
            duration_minutes: Desired activity duration
            available_locations: List of available locations
            
        Returns:
            dict: {
                'suggestions': [...],
                'error': None or error message
            }
        """
        if not self.api_key:
            return {
                'suggestions': [],
                'error': 'DeepSeek API key not configured'
            }
        
        try:
            # Build prompt
            prompt = self._build_prompt(
                free_time_blocks,
                activity_type,
                duration_minutes,
                available_locations
            )
            
            # Call API
            response = self._call_api(prompt)
            
            # Parse response
            suggestions = self._parse_response(response)
            
            return {
                'suggestions': suggestions,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"DeepSeek API error: {e}", exc_info=True)
            return {
                'suggestions': [],
                'error': str(e)
            }
    
    def _build_prompt(
        self,
        free_time_blocks: List[Dict],
        activity_type: str,
        duration_minutes: int,
        available_locations: List[Dict]
    ) -> str:
        """Build the prompt for DeepSeek"""
        
        # Format locations for prompt
        locations_list = []
        for loc in available_locations:
            locations_list.append({
                'id': loc.get('id', ''),
                'name': loc.get('name', ''),
                'address': loc.get('address', ''),
                'type': loc.get('type', '')
            })
        
        # Format free time blocks for prompt
        blocks_list = []
        for block in free_time_blocks:
            blocks_list.append({
                'date': str(block.get('date', '')),
                'start_time': block.get('start_time', ''),
                'end_time': block.get('end_time', ''),
                'available_minutes': block.get('available_minutes', 0),
                'previous_class': block.get('previous_class_name', 'Unknown'),
                'next_class': block.get('next_class_name', 'Unknown'),
                'previous_location': block.get('previous_class_location', 'Unknown'),
                'next_location': block.get('next_class_location', 'Unknown')
            })
        
        prompt = f"""You are an intelligent activity suggestion assistant for college students at Texas A&M University.

Your task is to analyze free time blocks in a student's schedule and suggest optimal activities.

STUDENT'S FREE TIME BLOCKS:
{json.dumps(blocks_list, indent=2)}

ACTIVITY PREFERENCES:
- Activity Type: {activity_type}
- Duration: {duration_minutes} minutes

AVAILABLE LOCATIONS:
{json.dumps(locations_list, indent=2)}

INSTRUCTIONS:
1. For each free time block, analyze if there's enough time for the activity (including commute time, estimate 5-15 minutes each way)
2. Consider the student's previous and next class locations when suggesting locations
3. Suggest the best 1-3 location(s) for each suitable time block
4. Provide clear, personalized reasoning for each suggestion
5. Rank suggestions by quality (1 = best option)
6. Only suggest if there's enough time (activity duration + commute + buffer)

RESPONSE FORMAT (JSON only, no markdown):
{{
  "suggestions": [
    {{
      "rank": 1,
      "date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "location_id": "location-id",
      "location_name": "Location Name",
      "reasoning": "Clear explanation of why this is a good suggestion",
      "confidence": 0.95
    }}
  ]
}}

Generate suggestions now. Return ONLY valid JSON, no markdown formatting:"""
        
        return prompt
    
    def _call_api(self, prompt: str) -> Dict:
        """Make API call to DeepSeek"""
        
        if not REQUESTS_AVAILABLE:
            error_msg = (
                "requests module not installed. "
                "DeepSeek API requires requests. "
                "Install with: pip install requests"
            )
            logger.error(error_msg)
            raise ImportError(error_msg)
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': self.model,
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a helpful assistant that provides activity suggestions in JSON format. Always return valid JSON only, no markdown code blocks.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'temperature': 0.7,
            'max_tokens': 2000
        }
        
        logger.info(f"Calling DeepSeek API with model: {self.model}")
        response = requests.post(
            self.api_url,
            headers=headers,
            json=data,
            timeout=30
        )
        
        response.raise_for_status()
        return response.json()
    
    def _parse_response(self, api_response: Dict) -> List[Dict]:
        """Parse API response and extract suggestions"""
        
        try:
            content = api_response['choices'][0]['message']['content']
            
            # Try to extract JSON from response
            # Handle cases where response might have markdown code blocks
            json_content = content.strip()
            
            if '```json' in json_content:
                json_start = json_content.find('```json') + 7
                json_end = json_content.find('```', json_start)
                json_content = json_content[json_start:json_end].strip()
            elif '```' in json_content:
                json_start = json_content.find('```') + 3
                json_end = json_content.find('```', json_start)
                if json_end == -1:
                    json_end = len(json_content)
                json_content = json_content[json_start:json_end].strip()
            
            # Parse JSON
            result = json.loads(json_content)
            suggestions = result.get('suggestions', [])
            
            logger.info(f"Parsed {len(suggestions)} suggestions from DeepSeek API")
            return suggestions
            
        except (KeyError, json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing DeepSeek response: {e}")
            logger.error(f"Response content: {api_response.get('choices', [{}])[0].get('message', {}).get('content', 'No content')}")
            return []

