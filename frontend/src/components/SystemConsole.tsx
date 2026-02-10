import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export type SystemConsoleHandle = {
  writeLog: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

const SystemConsole = forwardRef<SystemConsoleHandle>((_, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 10,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#00ff41',
        cursor: '#00ff41',
        selectionBackground: 'rgba(0, 255, 65, 0.3)',
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    // Ensure the terminal is opened before fitting
    term.open(terminalRef.current);
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Use ResizeObserver for more reliable fitting
    const resizeObserver = new ResizeObserver(() => {
      if (terminalRef.current && terminalRef.current.offsetWidth > 0) {
        try {
          fitAddon.fit();
        } catch (e) {
          // Ignore fit errors during rapid layout changes
        }
      }
    });
    resizeObserver.observe(terminalRef.current);

    term.writeln('\x1b[1;32m[ SYSTEM_INITIALIZED ]\x1b[0m');
    term.writeln('READY_FOR_DATA_STREAM...');

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    writeLog: (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
      if (!xtermRef.current) return;

      const timestamp = new Date().toLocaleTimeString();
      let colorCode = '\x1b[32m'; // Default green (info)
      
      if (type === 'success') colorCode = '\x1b[1;32m'; // Bright green
      if (type === 'error') colorCode = '\x1b[1;31m';   // Red
      if (type === 'warning') colorCode = '\x1b[1;33m'; // Yellow

      try {
        xtermRef.current.writeln(`[\x1b[90m${timestamp}\x1b[0m] ${colorCode}${message.toUpperCase()}\x1b[0m`);
      } catch (e) {
        console.error('Xterm write error:', e);
      }
    }
  }));

  return (
    <div className="h-full w-full bg-[#1a1a1a] p-1 overflow-hidden">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
});

SystemConsole.displayName = 'SystemConsole';

export default SystemConsole;
