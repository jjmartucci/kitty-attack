# Hello Kitty
Hello Kitty is a 2-dimensional game with a 10x12 grid of tiles. The player is a cat and the cat starts on a random tile. The player can move the cat up, down, left or right using arrow keys on a keyboard or a set of controls on the screen for touch based devices.

## Gameplay

The game logic is mice sprites move in from outside the grid and cross the grid in a straight line from left to right or top to bottom. If the player overlaps the cat with a mouse, the mouse disappears and the player is awarded points.

There are also dog sprites which move in from the sides or top or bottom, but they move in a zig-zag pattern 
    FOR EXAMPLE: one up then one over then one up
If the dog overlaps with the player's cat, the round ends.

The rounds are 60 seconds long, and we should allow a player to record their high scores and save them in localstorage.

## Additional Features
- Twice per game a bird sprite appears. It moves twice as fast as a mouse in a circular pattern, and is worth three times as much as a mouse.