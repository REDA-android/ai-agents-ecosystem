import asyncio
import random
import re
import time
import uuid
from typing import Any, Dict, List, Optional
from core.llm.client import UnifiedLLMClient

AIRI_PERSONALITIES = {
    "airi_default": {
        "name": "Airi",
        "title": "Compagne Virtuelle & Assistante Live",
        "tone": "Chaleureuse, expressive, vive et attentive",
        "avatar_model": "Live2D v4.2 / Airi Default Model"
    },
    "cyber_tech": {
        "name": "Airi-Cyber",
        "title": "Hacker & Architecte IA",
        "tone": "Précise, geek, rapide, orientée code et sécurité",
        "avatar_model": "Live2D Cyberpunk Shizuku"
    },
    "sensei": {
        "name": "Sensei-Airi",
        "title": "Mentore & Tutrice Pédagogique",
        "tone": "Patiente, bienveillante et didactique",
        "avatar_model": "Live2D Sensei Academic"
    }
}

class AiriAvatarAdapter:
    """Direct functional adapter for sources/airi (Live Conversational Avatar & Voice Companion).
    
    Provides emotion state computation, real-time viseme (lip-sync) generation,
    audio pipeline simulation, and character animation triggers.
    """

    def __init__(self, personality: str = "airi_default"):
        self.personality_key = personality
        self.personality = AIRI_PERSONALITIES.get(personality, AIRI_PERSONALITIES["airi_default"])
        self.llm = UnifiedLLMClient()
        self.current_emotion = "neutral"
        self.emotion_intensity = 0.5

    async def interact(
        self,
        user_speech_or_text: str,
        voice_enabled: bool = True
    ) -> Dict[str, Any]:
        """Processes user input, generates an emotional response, and produces lip-sync visemes."""
        start_time = time.time()
        interaction_id = f"airi-session-{uuid.uuid4().hex[:8]}"

        system_prompt = (
            f"Tu es {self.personality['name']}, {self.personality['title']}.\n"
            f"Ton style est : {self.personality['tone']}.\n"
            f"Important : Inclus au début de ton message une balise d'émotion parmi [HAPPY], [SURPRISED], [THINKING], [EXCITED], [CALM], [SAD].\n"
            f"Exemple : [HAPPY] Bonjour ! C'est un plaisir de te retrouver."
        )

        prompt = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_speech_or_text}
        ]
        
        response = await self.llm.generate_response(prompt)
        raw_text = response.choices[0].message.content or ""

        # Extract emotion tag
        emotion_tag_match = re.search(r"\[(HAPPY|SURPRISED|THINKING|EXCITED|CALM|SAD)\]", raw_text)
        detected_emotion = emotion_tag_match.group(1).lower() if emotion_tag_match else "happy"
        clean_text = re.sub(r"\[(HAPPY|SURPRISED|THINKING|EXCITED|CALM|SAD)\]", "", raw_text).strip()

        self.current_emotion = detected_emotion
        self.emotion_intensity = round(random.uniform(0.7, 0.95), 2)

        # Generate lipsync visemes based on generated text
        viseme_timeline = self._generate_visemes(clean_text)

        # Determine facial expression parameters
        expression_params = self._get_expression_params(detected_emotion)

        return {
            "status": "success",
            "framework": "Airi Conversational Avatar & Audio Engine",
            "interaction_id": interaction_id,
            "character": self.personality,
            "duration_seconds": round(time.time() - start_time, 3),
            "response_text": clean_text,
            "emotion": {
                "state": detected_emotion,
                "intensity": self.emotion_intensity,
                "expression_preset": expression_params["preset"],
                "eye_blink_rate": expression_params["eye_blink_rate"],
                "head_tilt_degrees": expression_params["head_tilt"]
            },
            "audio_metadata": {
                "voice_profile": "airi_neural_v2",
                "sample_rate_hz": 24000,
                "estimated_audio_duration_ms": len(clean_text) * 65,
                "streaming_format": "audio/pcm-16k" if voice_enabled else "disabled"
            },
            "visemes_count": len(viseme_timeline),
            "visemes_timeline": viseme_timeline[:12] # Return preview timeline
        }

    def _generate_visemes(self, text: str) -> List[Dict[str, Any]]:
        """Generates mock visemes timeline for Live2D / 3D avatar lip-sync animation."""
        viseme_types = ["aa", "ee", "ih", "oh", "ou", "rest"]
        timeline = []
        current_time_ms = 0
        words = text.split()

        for word in words:
            word_duration = max(150, len(word) * 45)
            # Pick primary viseme based on dominant vowel
            vowel = "aa"
            lower = word.lower()
            if "o" in lower or "u" in lower:
                vowel = "oh"
            elif "i" in lower or "y" in lower:
                vowel = "ee"
            elif "e" in lower:
                vowel = "ih"

            timeline.append({
                "time_ms": current_time_ms,
                "viseme": vowel,
                "weight": round(random.uniform(0.6, 1.0), 2)
            })
            current_time_ms += word_duration
            timeline.append({
                "time_ms": current_time_ms,
                "viseme": "rest",
                "weight": 0.0
            })
            current_time_ms += 40

        return timeline

    def _get_expression_params(self, emotion: str) -> Dict[str, Any]:
        mapping = {
            "happy": {"preset": "smile_wide", "eye_blink_rate": 0.3, "head_tilt": 4.5},
            "excited": {"preset": "sparkle_joy", "eye_blink_rate": 0.5, "head_tilt": 8.0},
            "thinking": {"preset": "pensive_gaze", "eye_blink_rate": 0.1, "head_tilt": -6.0},
            "surprised": {"preset": "wide_eyes", "eye_blink_rate": 0.05, "head_tilt": 2.0},
            "calm": {"preset": "gentle_smile", "eye_blink_rate": 0.2, "head_tilt": 0.0},
            "sad": {"preset": "slight_frown", "eye_blink_rate": 0.15, "head_tilt": -3.5}
        }
        return mapping.get(emotion, mapping["happy"])
