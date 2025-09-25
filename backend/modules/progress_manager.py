"""
Progress Manager for SSE (Server-Sent Events)
Manages and broadcasts processing progress updates
"""
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
import json
import uuid


class ProgressManager:
    """Manages progress updates for text humanization tasks"""
    
    def __init__(self):
        self.tasks: Dict[str, Dict] = {}
        self.listeners: Dict[str, List[asyncio.Queue]] = {}
    
    def create_task(self, task_id: Optional[str] = None) -> str:
        """Create a new task with unique ID"""
        if not task_id:
            task_id = str(uuid.uuid4())
        
        self.tasks[task_id] = {
            "id": task_id,
            "status": "initiated",
            "progress": 0,
            "message": "Iniciando proceso...",
            "created_at": datetime.now().isoformat(),
            "completed": False,
            "error": None
        }
        
        return task_id
    
    async def update_progress(self, task_id: str, status: str, progress: int, message: str, step: int = None, total_steps: int = None, phase: str = None, partial: str = None):
        """Update task progress and notify listeners"""
        if task_id not in self.tasks:
            return
        
        # Clamp para evitar retrocesos visuales
        try:
            last = int(self.tasks[task_id].get("progress", 0))
        except Exception:
            last = 0
        progress = max(int(progress), last)

        self.tasks[task_id].update({
            "status": status,
            "progress": progress,
            "message": message,
            "step": step,
            "total_steps": total_steps,
            "phase": phase,
            "partial": partial,
            "updated_at": datetime.now().isoformat()
        })
        
        # Notify all listeners for this task
        if task_id in self.listeners:
            update_data = {
                "task_id": task_id,
                "status": status,
                "progress": progress,
                "message": message,
                "step": step,
                "total_steps": total_steps,
                "phase": phase,
                "partial": partial,
                "timestamp": datetime.now().isoformat()
            }
            
            # Send to all listening queues
            for queue in self.listeners[task_id]:
                await queue.put(update_data)
    
    async def complete_task(self, task_id: str, success: bool = True, error: Optional[str] = None):
        """Mark task as completed"""
        if task_id not in self.tasks:
            return
        
        self.tasks[task_id].update({
            "completed": True,
            "success": success,
            "error": error,
            "completed_at": datetime.now().isoformat()
        })
        
        # Send final update
        await self.update_progress(
            task_id, 
            "completed" if success else "error",
            100 if success else self.tasks[task_id]["progress"],
            "Proceso completado exitosamente" if success else f"Error: {error}"
        )
        
        # Clean up listeners after a delay
        await asyncio.sleep(1)
        if task_id in self.listeners:
            del self.listeners[task_id]
    
    def add_listener(self, task_id: str) -> asyncio.Queue:
        """Add a new listener for task updates"""
        if task_id not in self.listeners:
            self.listeners[task_id] = []
        
        queue = asyncio.Queue()
        self.listeners[task_id].append(queue)
        return queue
    
    def remove_listener(self, task_id: str, queue: asyncio.Queue):
        """Remove a listener queue"""
        if task_id in self.listeners and queue in self.listeners[task_id]:
            self.listeners[task_id].remove(queue)
            if not self.listeners[task_id]:
                del self.listeners[task_id]
    
    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Get current status of a task"""
        return self.tasks.get(task_id)


# Global instance
progress_manager = ProgressManager()
