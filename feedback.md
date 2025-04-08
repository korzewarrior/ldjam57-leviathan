# Ludum Dare 57 - Leviathan Feedback

## Game Information
- **Theme**: Depths
- **Developer**: PopDaddyGames (@popdaddygames)
- **Time Spent**: Roughly 45 hours over the jam weekend
- **Tech Stack**: Plain HTML, CSS, and JavaScript (no engines or complex libraries)

## Ratings Summary
- **Overall**: 23 ratings
- **Fun**: 23 ratings
- **Innovation**: 23 ratings
- **Theme**: 23 ratings
- **Graphics**: 23 ratings
- **Audio**: 19 ratings
- **Humor**: 19 ratings
- **Mood**: 22 ratings

## User Feedback

### RukiMary (@rukimary)
> Nice little timekiller! Would definitely play in on phone. Tho mouse cursor comes out of the game window, a bit irritating..

**Developer Response**:
> I have pushed an update that should have the locked cursor. I debated back and forth on a locked cursor, I just didn't like the implementation but I've gone ahead and done it. Would you please let me know if it works / feels good / is too abrasive or full of friction? Thanks!

### bakuzen (@bakuzen)
> I gave the game a try just now, and I have to say nothing about the mouse controls felt weird– so I'd say the locked cursor works well :) (The movement was a little sensitive though, but that might just be my mouse set to a high sensitivity)
>
> Gameplay is smooth and I'm a big fan of the UI details/aesthetics, so I enjoyed it a lot ^^ The one thing I'd suggest is that there's little tension in the early game, a few peeks at the Leviathan chasing you would've been a great way to get me to lock in haha
>
> Overall awesome work on the whole project!

### Rustywolf (@rustywolf)
> Very addictive gameplay loop~

### Samilon (@samilon)
> Its alright! cool concept, but its a bit too fast for me…

### Kawair (@kawair)
> Nice experience! especially the graphics and UI! I have play it for more than 10 times, It's interesting; The boost system can always bring me out of dangerous
>
> If there's any suggestions I can give you, it would be the difficulties. It seems that the difficulty is placid, maybe you can add a dynamic difficulty I think?
>
> In a word it is a nice game!!! The gameplay is easy but interesting!

### Team 9tailed (@team-9tailed)
> Simple overall… well executed, but just feels a bit bland to me. However, being a jam game, it is understandable that you would be careful to limit your scope to something like this - you were able to achieve that better than I was :)

### Joey Vrij (@joey-vrij)
> I really liked the game, simple but very addictive feedback/gameplay loop. Very fun! Feels a bit like doodle jump (which I played for hours on end back in the day). A possible addition: Maybe add different obstacles or enemys, to create some variantion. Anyways, great job!

### Stratcat66 (@stratcat66)
> Quite simple, but I guess that can make the game addictive. I am still not 100% sure how it works exactly in the end.

### Placeholders (@placeholders)
> nice little arcade game! i like the simple controls and with all the polish it made it very easy to grab, and play again, and again, and again ! haha great job

### Kamile V. (@kamile-v)
> Thanks 4 the game ! :)

### Lollister (@lollister)
> Super fun and intuitive gameplay – I loved how you approached the theme! The whole experience felt really smooth. One thing I noticed: in the web version, it looks like the debug boxes are still visible during gameplay – but honestly, it didn't bother me at all. Great job!

### JackShadow (@jackshadow)
> I liked the visuals and the concept. What I felt was missing was a reliance on certain bonuses, which made it seem like the outcome depended mostly on pressing the acceleration at the right time and only about 10% on proper maneuvering. The game idea reminds me the alto adventure but in vertical design

### Nanamaki (@nanamaki)
> Neat little game. It can be great fun adding some variation and difficulty adujustment on this framework. Great solo jam entry!

### ThatFirey (@thatfirey)
> Had great fun playing this! The challenge and overall gameplay feel very nice, the ship controls smoothly yet responsively to the mouse, the speed-up gives a few moments to breath and satisfying overall in escaping the leviathan in last moments. The only complaint I have is that the obstacles appear a bit too suddenly, making it sometimes feel rather unfair that you hit something, I feel like either they should start with a bit slower speed or we should have a bit more FOV. But other than that, a really fun game ^^

### mgear (@mgear)
> No audio? At start the ship seemed to be in the left edge? Not sure what happens when you hit those walls, didnt seem to die and kept going.. so maybe some more info needed how to play or few tutorial steps at start

### Jim jagers (@jim-jagers)
> Fun little game, wish it had audio

### PopDaddyGames (@popdaddygames) [Developer Response]
> Background Music should be working again. SFX have been disabled because they were slowing down the polling / refresh && ultimately slowing down the game.
>
> I might come back to add the sfx back if I can come up with a non-performance-affecting method.
>
> Thanks!

### RoxxorXx (@roxxorxx)
> Damn so addictive. Very well designed game. Very polished game. That's insane! Very good job!

## Feedback Summary

### Positive Points
- Addictive gameplay loop
- Smooth, intuitive controls (after cursor lock was added)
- Clean UI and aesthetics
- Well-polished experience
- Good implementation of the theme
- Boost system is satisfying to use

### Areas for Improvement
- Add more tension/visibility of the Leviathan in early game
- Consider dynamic difficulty adjustments
- Add more variety with different obstacles or enemies
- Obstacles appear suddenly - could use more visibility or slower initial speed
- Better tutorial or onboarding for new players
- Audio issues were mentioned by multiple players (now addressed with BGM)

### Comparison Notes
- Similar to Doodle Jump (but vertical)
- Reminds some players of Alto Adventure (with vertical design)

## Implementation Plan

Based on the feedback received, here's a prioritized plan for future improvements:

### High Priority (Quick Wins)
1. **Early Game Tension** - Add occasional glimpses of the Leviathan in the early game to create tension and urgency
   - Implement brief visual cues of tentacles reaching down from above
   - Add subtle warning sounds/vibrations when the Leviathan is getting closer

2. **Obstacle Visibility** - Improve player ability to see and react to upcoming obstacles
   - Increase the visible playing area/FOV vertically
   - Add subtle visual indicators for upcoming obstacles
   - Consider a slight reduction in initial descent speed

3. **Tutorial/Onboarding** - Create clearer instructions for new players
   - Add a brief in-game tutorial explaining controls and objectives
   - Visual cues for how the boost mechanic works
   - Explain wall collision mechanics

### Medium Priority (Core Gameplay Enhancements)
1. **Dynamic Difficulty** - Implement a more engaging difficulty progression
   - Gradually increase obstacle density and complexity as players descend
   - Adjust Leviathan speed based on player performance
   - Create "phases" of difficulty that introduce new challenges

2. **Gameplay Variety** - Add more variety to keep the game fresh
   - Design 2-3 additional obstacle types with unique behaviors
   - Add occasional power-ups or bonuses (temporary invincibility, speed boost, etc.)
   - Create narrow "squeeze" sections that require precision

3. **Polish Audio Experience** - Build on the background music
   - Optimize SFX performance (implement audio pooling to reduce performance impact)
   - Add ambient sounds that increase tension with depth
   - Audio feedback for boost activation and obstacle collisions

### Long-term Improvements (Post-Jam)
1. **Mobile Compatibility** - Develop touch controls for mobile play
   - Tilt controls for movement
   - Touch anywhere to activate boost
   - Optimize UI for smaller screens

2. **Visual Progression** - Create visual changes as the player descends deeper
   - Gradual environmental changes (darker, more alien, etc.)
   - More intimidating obstacle designs at greater depths
   - Visual milestones to indicate progress

3. **Metagame Elements** - Add progression systems for replayability
   - Unlockable vessel variants with slightly different handling
   - Achievement system for completing specific challenges
   - Daily challenges with unique constraints

### Technical Improvements
1. **Performance Optimization**
   - Implement object pooling for obstacles and particles
   - Optimize collision detection
   - Find more efficient ways to implement SFX without impacting performance

2. **Remove Debug Elements**
   - Clean up any remaining debug visuals mentioned in feedback
   - Ensure a clean, polished player experience

This implementation plan addresses the core feedback while maintaining the simple, addictive nature of the game that players enjoyed. Prioritizing visibility improvements and early game tension will address the most common player concerns, while the medium and long-term improvements can expand the game's depth and replayability. 