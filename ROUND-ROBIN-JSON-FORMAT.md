# Round Robin JSON Format

This document describes the JSON format required for quick setup of Round Robin tournaments.

## JSON Structure

```json
{
  "format": { ... },
  "groupA": [ ... ],
  "groupB": [ ... ],
  "matches": [ ... ]
}
```

## Required Fields

### 1. `format` (object)
Defines the match format for all games.

**Option A - Best Of Format:**
```json
{
  "type": "bestOf",
  "totalLegs": 5
}
```
- `type`: Must be `"bestOf"`
- `totalLegs`: Number (1-15) - Total legs to play (e.g., Best of 5 = first to 3)

**Option B - Play All (First To) Format:**
```json
{
  "type": "playAll",
  "legsToWin": 3
}
```
- `type`: Must be `"playAll"`
- `legsToWin`: Number (1-11) - First player to win this many legs wins

### 2. `groupA` (array)
Array of 5 player names for Group A.

```json
"groupA": [
  "John Smith",
  "Sarah Johnson",
  "Mike Williams",
  "Emily Brown",
  "David Jones"
]
```
- **Must contain exactly 5 strings**
- Each string is a player name

### 3. `groupB` (array)
Array of 5 player names for Group B.

```json
"groupB": [
  "Lisa Davis",
  "Robert Miller",
  "Jennifer Wilson",
  "Michael Moore",
  "Amanda Taylor"
]
```
- **Must contain exactly 5 strings**
- Each string is a player name

### 4. `matches` (array)
Array of 20 match objects defining the tournament schedule.

Each match object has the following structure:

```json
{
  "matchNum": 1,
  "player1": "John Smith",
  "player2": "Sarah Johnson",
  "board": 1,
  "time": "10:00 AM"
}
```

**Match Object Fields:**
- `matchNum` (required): Number (1-20) - Sequential match number
- `player1` (required): String - First player name (must match a name from groupA or groupB)
- `player2` (required): String - Second player name (must match a name from groupA or groupB)
- `board` (required): Number (1 or 2) - Board assignment
  - **Board 1** = Live stream board (interviews will be conducted)
  - **Board 2** = Secondary board (no interviews)
- `time` (optional): String - Match time (e.g., "10:00 AM", "2:30 PM")

**Important Notes:**
- **Must contain exactly 20 match objects**
- Typically the first 10 matches are Board 1, last 10 are Board 2
- Only Board 1 matches will trigger post-match interviews
- Player names must exactly match names defined in groupA or groupB

## Complete Examples

See the following template files:
- `round-robin-template.json` - Best Of 5 format with times
- `round-robin-template-playall.json` - First To 3 format without times

## Validation Rules

The JSON upload will fail if:
1. Missing any required field (`format`, `groupA`, `groupB`, `matches`)
2. `groupA` or `groupB` doesn't have exactly 5 players
3. `matches` array doesn't have exactly 20 match objects
4. Invalid format type (must be "bestOf" or "playAll")
5. Invalid JSON syntax

## Usage

1. Create your JSON file following this format
2. Go to "Round Robin Setup" screen
3. Click "Upload JSON" file input
4. Select your JSON file
5. All fields will auto-populate
6. Click "Start Round Robin" to begin

The app will display a success message (✓) or error message (✗) after upload.
