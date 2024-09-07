# Skillsweeper
### Link: https://s-dylan-kim.github.io/Skillsweeper/
Minesweeper, but luck is never a factor

## Rules
- If you take a 50/50 guess when there is a guarenteed move, you will always lose the 50/50.
- If you are forced to take a 50/50, there will never be a mine under the 50/50.
- All other rules are like standard minesweeper.

## 50/50 detection Algorithm
- backtracking with DFS
- have a history stack to keep track of current path
- have a to visit stack
- algorithm steps
  1. starting from a node DFS through unrevealed tiles that share a number
  2. check if the configuration thus far satisfies all revealed numbers
  3. if valid keep going
  4. if invalid backtrack (backtracking rules below)
  5. if there are no more tiles to visit and this configuration is valid. We found a configuration for this group!
- backtracking order for each tile
  * try bomb
  * if bomb doesn't work try empty
  * after trying both remove this one from path and alter previous one (recursive)

## challenges
- since we have to calculate what tiles are safe using brute force, the solution was not scalable to larger board sizes
  * prioritize adding close tiles to the stack last, as branches are more likely to end with more correlated tiles
- bomb counting solutions cause some situations where internal tiles that are not connected to a revealed number tile are safe
  * count number of bombs in minimal bomb solution accross all group and if the number is eqal to the number of bombs, make all internal tiles safe
  
