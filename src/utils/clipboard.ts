/**
 * Centralized App Clipboard Utility
 * Allows copying and pasting OTP codes and credentials within the app.
 */
class AppClipboard {
  private buffer: string = '';

  /**
   * Sets the clipboard text
   */
  setString(content: string): void {
    this.buffer = content;
    console.log(`📋 [CLIPBOARD COPIED]: ${content}`);
  }

  /**
   * Gets the clipboard text
   */
  getString(): string {
    return this.buffer;
  }

  /**
   * Checks whether clipboard currently has content
   */
  hasString(): boolean {
    return this.buffer.length > 0;
  }

  /**
   * Clears clipboard content
   */
  clear(): void {
    this.buffer = '';
  }
}

export const appClipboard = new AppClipboard();

