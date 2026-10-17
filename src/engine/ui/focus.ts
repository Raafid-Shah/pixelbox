// src/engine/ui/focus.ts
export interface FocusableItem {
  id: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSelect?: () => void;
  onCancel?: () => void;
}

export type FocusLayout = 'vertical' | 'horizontal' | 'grid';

export class FocusManager {
  private items: FocusableItem[] = [];
  private currentIndex = 0;
  private layout: FocusLayout = 'vertical';
  private columns = 1;
  private locked = false;

  constructor(layout: FocusLayout = 'vertical', columns: number = 1) {
    this.layout = layout;
    this.columns = Math.max(1, columns);
  }

  public setItems(items: FocusableItem[], startIndex = 0): void {
    if (this.items[this.currentIndex] && this.items[this.currentIndex] !== items[startIndex]) {
      this.items[this.currentIndex].onBlur?.();
    }
    this.items = [...items];
    this.currentIndex = Math.max(0, Math.min(startIndex, this.items.length - 1));
    if (this.items[this.currentIndex]) {
      this.items[this.currentIndex].onFocus?.();
    }
  }

  public addItem(item: FocusableItem): void {
    this.items.push(item);
    if (this.items.length === 1) {
      this.currentIndex = 0;
      item.onFocus?.();
    }
  }

  public getFocusedItem(): FocusableItem | undefined {
    return this.items[this.currentIndex];
  }

  public getIndex(): number {
    return this.currentIndex;
  }

  public setLock(locked: boolean): void {
    this.locked = locked;
  }

  public navigate(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): boolean {
    if (this.locked || this.items.length === 0) return false;
    const prev = this.currentIndex;
    const len = this.items.length;

    if (this.layout === 'vertical') {
      if (direction === 'UP') {
        this.currentIndex = (this.currentIndex - 1 + len) % len;
      } else if (direction === 'DOWN') {
        this.currentIndex = (this.currentIndex + 1) % len;
      }
    } else if (this.layout === 'horizontal') {
      if (direction === 'LEFT') {
        this.currentIndex = (this.currentIndex - 1 + len) % len;
      } else if (direction === 'RIGHT') {
        this.currentIndex = (this.currentIndex + 1) % len;
      }
    } else if (this.layout === 'grid') {
      const cols = this.columns;
      const rows = Math.ceil(len / cols);
      const r = Math.floor(this.currentIndex / cols);
      const c = this.currentIndex % cols;

      if (direction === 'UP') {
        const newR = (r - 1 + rows) % rows;
        this.currentIndex = Math.min(len - 1, newR * cols + c);
      } else if (direction === 'DOWN') {
        const newR = (r + 1) % rows;
        this.currentIndex = Math.min(len - 1, newR * cols + c);
      } else if (direction === 'LEFT') {
        const newC = (c - 1 + cols) % cols;
        this.currentIndex = r * cols + newC;
      } else if (direction === 'RIGHT') {
        const newC = (c + 1) % cols;
        this.currentIndex = Math.min(len - 1, r * cols + newC);
      }
    }

    if (this.currentIndex !== prev) {
      this.items[prev]?.onBlur?.();
      this.items[this.currentIndex]?.onFocus?.();
      return true;
    }
    return false;
  }

  public select(): boolean {
    if (this.locked || this.items.length === 0) return false;
    const item = this.items[this.currentIndex];
    if (item && item.onSelect) {
      item.onSelect();
      return true;
    }
    return false;
  }

  public cancel(): boolean {
    if (this.locked || this.items.length === 0) return false;
    const item = this.items[this.currentIndex];
    if (item && item.onCancel) {
      item.onCancel();
      return true;
    }
    return false;
  }
}