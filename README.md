# requestTimestep

A custom timestep function for Node.js using setImmediate that runs the update callback twice as often as the defined FPS, ensuring a more reliable render pipeline.

## Introduction

Use this package for precise game state updates and smooth client rendering in multiplayer games. It's framework-independent, so you'll need to install and set up your own server and game frameworks. This allows integration with any server or game engine of your choice.

## API

This packages encapsulates a robust implementation of a game loop manager for Node.js, ensuring precise control over game state updates and rendering. It offers flexibility through customizable FPS settings and callback handling, making it suitable for various game development needs in a Node.js environment.

### Options

```ts
{
  onRender: function() {...},
  onUpdate: function() {...},
  fps: 10,
  offset: 0
}
```

#### `onRender?: function(response: TimestepRenderResponse)`
#### `onUpdate?: function(response: TimestepUpdateResponse)`
#### `fps?: number`
#### `offset?: number`


### TimestepRenderResponse

```ts
{
  currentFPS: number;
  averageFPS: number;
  timestamp: number;
  delta: number;
  duration: number;
  currentIndex: number;
  currentFrame: number;
  offset: number;
}
```

### TimestepUpdateResponse


```ts
{
   currentFPS: number;
  timestamp: number;
  delta: number;
  duration: number;
  currentIndex: number;
  currentFrame: number;
  offset: number;
}
```

### Interface

#### instance.stop: function() => void
#### instance.resume: function() => void
#### instance.isActive: function() => boolean
#### instance.updateFps: function(fps?: number) => void
