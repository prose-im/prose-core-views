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

export enum Modifier {
  // Scroll modifier.
  Scroll = "scroll"
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

export enum FileAction {
  // File action is expand.
  Expand = "expand",
  // File action is download.
  Download = "download"
}

export enum FileType {
  // File type is image.
  Image = "image",
  // File type is video.
  Video = "video",
  // File type is audio.
  Audio = "audio",
  // File type is other.
  Other = "other"
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
  getStyleModifier: () => Modifier;
  getAccountJID: () => string;
  setLanguage: (code: string) => void;
  setStylePlatform: (platform: Platform) => void;
  setStyleTheme: (theme: Theme) => void;
  setStyleModifier: (name: Modifier, value: any) => void;
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

export declare interface EventMessageFileView {
  id: string;
  action: FileAction;

  file: {
    type: FileType;
    name: null | string;
    url: string;
  };

  adjacents?: {
    before: Array<EventMessageFileView>;
    after: Array<EventMessageFileView>;
  };
}

export declare interface EventMessageHistorySeek {
  direction: SeekDirection;
}

// EXPORTS

export default Messaging;
