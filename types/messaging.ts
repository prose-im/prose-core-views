/*
 * prose-core-views
 *
 * Copyright: 2023, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// ENUMERATIONS

export enum Theme {
  // Light theme.
  Light = "light",
  // Dark theme.
  Dark = "dark"
}

export enum Platform {
  // Web platform.
  Web = "web",
  // macOS platform.
  macOS = "macos"
}

export enum SeekDirection {
  // History will load in backwards direction.
  Backwards = "backwards",
  // History will load in forwards direction.
  Forwards = "forwards"
}

export enum OriginType {
  // Origin is button.
  Button = "button",
  // Origin is context menu.
  ContextMenu = "context-menu"
}

// INTERFACES

export declare interface Messaging extends Window {
  MessagingContext: MessagingContext;
  MessagingStore: MessagingStore;
  MessagingEvent: MessagingEvent;
}

export declare interface MessagingContext {
  getLanguage: () => string;
  getStylePlatform: () => Platform;
  getStyleTheme: () => Theme;
  getAccountJID: () => string;
  setLanguage: (code: string) => void;
  setStylePlatform: (platform: Platform) => void;
  setStyleTheme: (theme: Theme) => void;
  setAccountJID: (jid: string) => void;
}

export declare interface MessagingStore {
  exists: (messageId: string) => boolean;
  resolve: (messageId: string) => null | MessagingStoreMessageData;
  restore: (...messages: MessagingStoreMessageData[]) => boolean;
  insert: (...messages: MessagingStoreMessageData[]) => boolean;
  update: (
    messageId: string,
    messageDiff: MessagingStoreMessageData
  ) => boolean;
  retract: (messageId: string) => boolean;
  flush: () => boolean;
  highlight: (messageId: null | string) => boolean;
  interact: (messageId: string, action: string, isActive: boolean) => boolean;
  loader: (type: string, isVisible: null | boolean) => boolean;
  identify: (
    jid: string,
    identity: null | MessagingStoreIdentifyIdentity
  ) => boolean;
}

export declare interface MessagingStoreMessageData {
  id?: string;
  type?: string;
  date?: string;
  from?: string;
  content?: string;
  text?: string;

  metas?: {
    encrypted?: boolean;
    edited?: boolean;
  };

  reactions?: Array<{
    reaction: string;
    authors: Array<string>;
  }>;
}

export declare interface MessagingStoreIdentifyIdentity {
  name?: string;
  avatar?: string;
}

export declare interface MessagingEvent {
  off: (namespace: string) => boolean;
  on: (namespace: string, handler: (event: any) => void) => boolean;
}

export declare interface EventMessageAnyOrigin {
  type: OriginType;

  anchor: {
    x: number;
    y: number;
  };

  parent: void | {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export declare interface EventMessageActionsView {
  id: string;
  origin: EventMessageAnyOrigin;
}

export declare interface EventMessageReactionsView {
  id: string;
  origin: EventMessageAnyOrigin;
}

export declare interface EventMessageReactionsReact {
  id: string;
  reaction: string;
  active: boolean;
}

export declare interface EventMessageHistorySeek {
  direction: SeekDirection;
}

// EXPORTS

export default Messaging;
