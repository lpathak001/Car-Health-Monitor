#!/usr/bin/env python3
"""
Generate a 10-second demo video showing Car Health Monitor dashboard
"""

import cv2
import numpy as np
from datetime import datetime
import os

# Video settings
width, height = 1280, 720
fps = 30
duration = 10  # seconds
total_frames = fps * duration

# Create video writer
output_path = 'demo-video.mp4'
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

# Colors
bg_color = (240, 242, 245)  # Light blue
primary_color = (102, 126, 234)  # Purple-blue
secondary_color = (118, 75, 162)  # Purple
text_color = (51, 51, 51)  # Dark gray
white = (255, 255, 255)
green = (76, 175, 80)
orange = (255, 193, 7)
red = (244, 67, 54)

def create_frame(frame_num):
    """Create a single frame"""
    frame = np.ones((height, width, 3), dtype=np.uint8)
    frame[:] = bg_color
    frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    
    # Calculate animation progress (0 to 1)
    progress = frame_num / total_frames
    
    # Title
    cv2.putText(frame, 'Car Health Monitor', (50, 60), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, text_color, 2)
    cv2.putText(frame, 'Real-time Analytics Dashboard', (50, 95), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (150, 150, 150), 1)
    
    # Draw animated stat cards
    card_width = 280
    card_height = 120
    card_y = 130
    cards = [
        ('Fleet Health', '92.4%', green),
        ('Total Readings', '75,470', primary_color),
        ('Anomalies', '54', orange),
        ('System Uptime', '99.93%', green)
    ]
    
    for i, (label, value, color) in enumerate(cards):
        x = 50 + i * (card_width + 20)
        
        # Animate card appearance
        alpha = min(1.0, progress * 5 - i * 0.3)
        if alpha > 0:
            # Draw card background
            cv2.rectangle(frame, (x, card_y), (x + card_width, card_y + card_height), 
                         color, -1)
            
            # Draw label
            cv2.putText(frame, label, (x + 15, card_y + 35), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, white, 1)
            
            # Draw value with animation
            cv2.putText(frame, value, (x + 15, card_y + 85), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, white, 2)
    
    # Draw animated bar chart
    chart_y = 300
    chart_height = 200
    bars = [
        ('Toyota', 95, green),
        ('Honda', 88, orange),
        ('Tesla', 96, green),
        ('Ford', 92, primary_color),
        ('BMW', 90, secondary_color)
    ]
    
    cv2.putText(frame, 'Fleet Health Summary', (50, chart_y - 20), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.8, text_color, 2)
    
    for i, (name, health, color) in enumerate(bars):
        y = chart_y + i * 35
        
        # Animate bar fill
        bar_progress = min(1.0, (progress - 0.3) * 2)
        bar_width = int(400 * health / 100 * bar_progress)
        
        if bar_width > 0:
            cv2.rectangle(frame, (150, y), (150 + bar_width, y + 25), color, -1)
        
        # Draw label
        cv2.putText(frame, f'{name}: {health}%', (50, y + 18), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 1)
    
    # Draw animated metrics
    metrics_y = 600
    metrics = [
        ('Annual Savings', '$29,700'),
        ('ROI', '70%'),
        ('Vehicles', '5')
    ]
    
    for i, (label, value) in enumerate(metrics):
        x = 50 + i * 350
        
        # Animate metric appearance
        alpha = min(1.0, (progress - 0.5) * 3 - i * 0.2)
        if alpha > 0:
            cv2.putText(frame, label, (x, metrics_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (150, 150, 150), 1)
            cv2.putText(frame, value, (x, metrics_y + 35), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, primary_color, 2)
    
    # Draw footer
    footer_text = 'Features: Analytics | Predictive Maintenance | Alerts & Notifications'
    cv2.putText(frame, footer_text, (50, height - 30), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (150, 150, 150), 1)
    
    # Draw timestamp
    timestamp = f'Frame: {frame_num + 1}/{total_frames}'
    cv2.putText(frame, timestamp, (width - 250, height - 30), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1)
    
    return frame

# Generate video
print(f"Generating {duration}-second demo video...")
for frame_num in range(total_frames):
    frame = create_frame(frame_num)
    out.write(frame)
    
    if (frame_num + 1) % 30 == 0:
        print(f"  Progress: {frame_num + 1}/{total_frames} frames")

out.release()
print(f"✅ Video saved to: {output_path}")
print(f"   Duration: {duration} seconds")
print(f"   Resolution: {width}x{height}")
print(f"   FPS: {fps}")
