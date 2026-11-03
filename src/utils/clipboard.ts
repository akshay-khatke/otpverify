
class AppClipboard {
  private buffer: string = '';


  setString(content: string): void {
    this.buffer = content;
    console.log(`📋 [CLIPBOARD COPIED]: ${content}`);
  }


  getString(): string {
    return this.buffer;
  }


  hasString(): boolean {
    return this.buffer.length > 0;
  }


  clear(): void {
    this.buffer = '';
  }
}

export const appClipboard = new AppClipboard();

