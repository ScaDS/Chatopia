# Chatopia
Real-Time Multi-Agent Simulations with Latency-Aware Distributed Reasoning

This repository contains a demonstrator built based on Chatopia using Godot Engine.
The demonstrator simulates an AI research office.

IN this platform characters (Player and NPCs) interact with the world and each other, driven by a mix of utility-based AI (Needs/Stats) and Large Language Model (LLM) generation via a custom API.

## How to run the demonstrator locally:

1. Clone the repository
   ```bash
   git clone https://github.com/ScaDS/Chatopia.git
   ```
   ```bash
   cd Chatopia
   ```


2. Build the Container

   ```bash
   export MY_IP=$(hostname -I | awk '{print $1}')
   ```
   ```bash
   sudo docker build --build-arg SERVER_IP=$MY_IP -t chatopia-demo .
   ```

3. Run the Container

   ```bash
   sudo docker run -d -p 80:80 -p 443:443 -e SERVER_IP=$MY_IP --name chatopia chatopia-demo
   ```

4. Access the demonstrator
   ```bash
   echo https://$MY_IP/demo
   ```
   Open your web browser and navigate to the URL shown as the output of previous command. 

> Note: The demonstrator requires an active internet connection to communicate with the LLM backend.

### Primary Goal:
To build a flexible, robust prototype where NPCs have autonomy, memory, and needs, viewable via a “Spectator Mode.”

## Core Mechanics

### Centralized AI Core
All LLM interactions are handled by a PromptService.  
It manages API keys, constructs dynamic context (Room + Time + Events + Object Content), and chains tasks (e.g., getting a response -> requesting a summary).

### Autonomous NPC Brain (Strategy & Tags)
**Strategy System (New):** NPCs map generic needs (e.g., "Health") to specific Semantic Tags (e.g., `["coffee", "water", "snack"]`). They randomly select a valid tag to satisfy a need, creating varied behavior.

**Tag Search (New):** NPCs query the WorldGraph for objects matching the selected tag (e.g., "Find nearest object with tag 'coffee'").

**Home/Office Assignments:** NPCs return to specific desks when idle.

**Navigation:** Uses NavigationAgent2D for purposeful pathfinding.

### Interactive Object System (Read/Write)
**Dual Interaction (New):** Objects can trigger Stat Boosts AND open a UI simultaneously (e.g., reading a whiteboard also boosts productivity).

**Persistent Content (New):** Objects like Pinboards and Whiteboards store a `content_text` string. Players can Read this text and Write new text via a popup UI (`NoteUI`). This text remains on the specific object instance in the world.

**Context Awareness:** The text written on objects is exposed to the LLM via `get_context_prompt()`, allowing NPCs to "read" the room in future updates.

### NPC Agency & Initiated Dialogue
NPCs can proactively decide to talk to the Player based on RNG and proximity.  
They display a visual cue (Speech Bubble) and enter a “Waiting” state.  
If the Player accepts, the NPC’s opening line (e.g., “Hey, got a minute?”) is injected into the conversation history, preserving context so the LLM knows it initiated the chat.

### Spectator Mode (Auto-Pilot)
Pressing **I** detaches the camera and gives control to the AI. NPCs roam, work, and automatically initiate conversations with each other when they meet.

### Persistent Memory (Email System)
Players can use a PC object to write “emails” to NPCs. These are injected directly into the NPC’s conversation history, allowing them to remember and reference the message later.

### Dynamic Tasks & Hints
**TaskManager:** A global singleton that tracks active objectives based on character state.

**Player Hints (New):** The Player receives specific, tag-based hints (e.g., "Health Low: Find Coffee") rather than generic stat warnings ("Increase Health").

## Scene Architecture

The project follows a modular, decoupled architecture.

### Key Scenes (.tscn files)

- **World.tscn:** The main scene. It acts as the “controller” for the simulation, managing which character is active and connecting signals between different simulation elements.
- **Character.tscn:** A base template for all characters. It uses a “paper doll” system with multiple AnimatedSprite2D nodes for layered visuals (body, hair, clothes). It contains all the necessary nodes for movement, stats, and interaction.
- **Player.tscn / npc_franz.tscn etc.:** Inherited scenes from Character.tscn. These are used to create unique characters by overriding the SpriteFrames resources and setting unique stats in the Inspector.
- **HUD.tscn:** A UI scene for the Heads-Up Display. Acts as a layout container for:
  - **TaskUI.tscn (New):** A modular UI component that listens to TaskManager and displays the current task list.
  - **ResourceBars:** Display Health/Productivity.
- **InteractiveObject.tscn:** Updated template for objects. Now supports:
  - Tags: Array of strings (e.g., `["plant", "nature"]`).
  - Content Text: Persistent string memory.
  - Dual Interaction: Can trigger stats AND open NoteUI.
- **NoteUI.tscn (New):** A modular UI component containing a Title Label, Text Edit box, and Save button. Used for reading/writing persistent text on objects.
- **DialogueUI.tscn:** A UI scene for the dialogue box. It is loaded as a global Autoload singleton named DialogueUIManager.
- **Room.tscn:** A template for a single room, which is generated procedurally by its script.
- **DebugOverlay.tscn:** Developer overlay showing: Current room, neighbors, entities and Last 5 events from EventLog. Uses collapsible PanelContainers.
- **HelpScreen.tscn:** User manual and key controls.
- **MusicPlayer.tscn:** MusicPlayer.
- **SoundManager.tscn:** Manager of sound buses.
- **LetterUI.tscn:** A text-editor interface for sending emails to NPCs.

## Script Architecture (.gd files)

### world.gd (autoload)
The central controller script.  
Tracks the currently_controlled_character.  
Handles the switch_character input to change the active character.  
Connects signals from InteractiveObjects and Character dialogue ranges to the appropriate handlers.  
Tells the HUD which character to display stats for.  
Manages a hovering pointer sprite to indicate the controlled character.

### MemoryLoader.gf (autoload)
Handles previous conversations history.

### WorldGraph.gd (autoload - Updated)
Global spatial graph of the world. Stores rooms (bounds, doors, entities), doors (connections), and entities (characters, objects).  

**Tag Search (New):** Added `find_nearest_object_with_tag(tag, origin)`. This is the core search function for the new AI strategy.  
**Entity Registration:** Updated `register_entity` to accept and store an array of tags.  
Tracks Room Ownership (`owner_id`) and Home Assignments (`home_room_id`).

### Character.gd (Updated)
The most important base script. Extends CharacterBody2D.  

**Strategy Map (New):** Contains a dictionary mapping stats to tags (e.g., `{"Health": ["coffee", "water"]}`).  
**Player Hints (New):** Intercepts low-stat signals for the player to generate specific "Find [Item]" tasks instead of generic text.  
**AI Logic:** Checks stats every 2 seconds. If low, it picks a random tag from the strategy map and queries WorldGraph for that specific tag.  
**Auto-Handshake:** Detects other NPCs. If in Spectator Mode, negotiates with DialogueUIManager to start an AI-vs-AI conversation.  
**Proactive Interaction:** Has a `requesting_player_chat` flag. Uses a timer to randomly decide to initiate conversation with the Player.

### player.gd & npc.gd
Very simple scripts that extend Character.gd and contain minimal unique logic.

**Context-Sensitive Input (Player.gd):** The `_unhandled_input` (Key ‘D’) logic checks the target NPC’s state.  
If NPC is requesting_player_chat: Calls `DialogueUIManager.player_accept_invite`.  
If NPC is Idle: Calls `DialogueUIManager.player_request_join`.

### InteractiveObject.gd (Updated)
Variables: Added `object_tags` (Array) and `content_text` (String).  
Logic: Updated `_unhandled_input` to handle `InteractionType.OPEN_UI` by triggering both the stat boost and passing self to the UI instance.  
Context: `get_context_prompt()` now includes `content_text` (e.g., `"A whiteboard. Written on it: 'Do not erase'"`).  
Email Logic: If sending an email, it looks up the recipient in WorldGraph and calls `DialogueUIManager.inject_message_into_history`.

### NoteUI.gd (New)
Handles the logic for the Read/Write window.  
`open_with_object(player, object)` freezes the player, loads `object.content_text` into the input field, and focuses it.  
`_on_save_pressed` writes the text back to the object.

### TaskUI.gd (New)
Connects to TaskManager signals.  
Updates a label list to display active tasks.  
Extends Control to fit inside the HUD's VBoxContainer.

### DialogueUI.gd
The global dialogue manager.  
**Prompt Construction:** Builds detailed prompts (System + NPC + Task + History).  
**Moderator:** Manages AI-vs-AI conversations by alternating turns between two characters automatically.  
**Memory Injection:** Allows external scripts to insert text (emails) into the history file.  
**Greeting Injection:** `player_accept_invite()` creates a session and immediately appends the NPC’s greeting to the history.  
**Sanitization:** Aggressively cleans output to prevent “Double Name” bugs.  
**Global Input Handling:** Intercepts `ui_cancel` (Escape) globally to close the session.

### HUD.gd
Connects to the active character’s ResourceBar signals and updates the TextureProgressBar and Label nodes.  
Acts as the container for TaskUI.

### ResourceBar.gd
A reusable script for a single stat bar. Attached to ProductivityBar and HealthBar nodes. Emits `value_changed` and `task_generation_requested`.

### room.gd
Procedurally generates a room’s floor tiles and collision walls based on exported variables.

### SoundManager.gd
A global Autoload for playing sound effects.

### TimeService.gd (autoload)
Tracks day/hour/minute/phase. Adjustable time_scale. Signals: `minute_changed`, `phase_changed`.

### EventBus.gd (autoload)
Centralized event channel. Provides: `emit_event`.

### EventLog.gd (autoload)
Subscribes to EventBus. Stores events in memory (default: 5000 max).

### DebugOverlay.gd
Shows: Current room + neighbors, Entities in room, Last 5 events.

### PromptService.gd
The Central Intelligence.  
Stores the System Prompt and Task Prompts.  
Assembles the Environment Prompt by querying WorldGraph, TimeService, and EventLog.  
Manages the HTTPRequest to the LLM API.  
Environment Aware: Detects if running locally (Direct API) or in Docker (Nginx Proxy).

### TaskManager.gd
Tracks list of active strings (“Increase Health”). ResourceBars emit signals to add/remove tasks based on thresholds.

## Credits
- House interior: https://graduation-cat.itch.io/house-interior-tileset-32x32
- Volume and Mute Icons Free Assetpack: https://skalding.itch.io/volume-and-mute-icon
- Universal-LPC-Spritesheet-Character-Generator: https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator
- Health Bar Asset Pack 2: https://adwitr.itch.io/pixel-health-bar-asset-pack-2
