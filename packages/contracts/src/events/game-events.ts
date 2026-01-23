/**
 * Real-time WebSocket Events
 *
 * Events sent between backend and frontend via WebSocket.
 */

export interface GameStateUpdatedEvent {
  type: 'game:state-updated';
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface PlayerConnectedEvent {
  type: 'player:connected';
  timestamp: number;
  payload: {
    playerId: string;
    displayName: string;
  };
}

export interface PlayerDisconnectedEvent {
  type: 'player:disconnected';
  timestamp: number;
  payload: {
    playerId: string;
  };
}

export type GameEvent =
  | GameStateUpdatedEvent
  | PlayerConnectedEvent
  | PlayerDisconnectedEvent;
