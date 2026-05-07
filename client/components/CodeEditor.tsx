"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { executeCode, checkServerHealth } from "@/lib/services/judge0";

interface CodeEditorProps {
  onClose: () => void;
  onShareWithAI?: (code: string, language: string) => void;
}

const languages = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "csharp", label: "C#" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "php", label: "PHP" },
  { id: "ruby", label: "Ruby" },
  { id: "swift", label: "Swift" },
];

const defaultCode: Record<string, string> = {
  javascript: `// JavaScript code here
function solution() {
  // Write your code here
  
}

console.log(solution());`,
  typescript: `// TypeScript code here
function solution(): void {
  // Write your code here
  
}

console.log(solution());`,
  python: `# Python code here
def solution():
    # Write your code here
    pass

print(solution())`,
  java: `// Java code here
public class Solution {
    public static void main(String[] args) {
        // Write your code here
        
    }
}`,
  cpp: `// C++ code here
#include <iostream>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`,
  c: `// C code here
#include <stdio.h>

int main() {
    // Write your code here
    
    return 0;
}`,
  csharp: `// C# code here
using System;

class Solution {
    static void Main() {
        // Write your code here
        
    }
}`,
  go: `// Go code here
package main

import "fmt"

func main() {
    // Write your code here
    
}`,
  rust: `// Rust code here
fn main() {
    // Write your code here
    
}`,
  php: `<?php
// PHP code here
function solution() {
    // Write your code here
    
}

echo solution();`,
  ruby: `# Ruby code here
def solution
  # Write your code here
  
end

puts solution`,
  swift: `// Swift code here
import Foundation

func solution() {
    // Write your code here
    
}

print(solution())`,
};

const CodeEditor = ({ onClose, onShareWithAI }: CodeEditorProps) => {
  const { resolvedTheme } = useTheme();
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(defaultCode["javascript"]);
  const [theme, setTheme] = useState<"vs-dark" | "vs-light">("vs-dark");

  useEffect(() => {
    if (resolvedTheme === "light") {
      setTheme("vs-light");
    } else {
      setTheme("vs-dark");
    }
  }, [resolvedTheme]);

  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"success" | "error" | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  // Check server status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const isOnline = await checkServerHealth();
      setServerStatus(isOnline ? "online" : "offline");
    };
    checkStatus();
  }, []);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(defaultCode[newLang] || "// Write your code here\n");
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorInstance.focus();
    
    // Track cursor position
    editorInstance.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setShowOutput(true);
    setResult("Compiling...");
    setResultType(null);

    try {
      const executionResult = await executeCode({
        code,
        language,
      });

      if (executionResult.compileOutput || executionResult.error) {
        setResult(executionResult.compileOutput || executionResult.error || "Compilation failed");
        setResultType("error");
      } else {
        setResult("✓ Compilation successful! No errors found.");
        setResultType("success");
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setResultType("error");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setShowOutput(true);
    setResult("Running...");
    setResultType(null);

    try {
      const executionResult = await executeCode({
        code,
        language,
      });

      let outputText = "";

      if (executionResult.compileOutput) {
        outputText += `Compilation Output:\n${executionResult.compileOutput}\n\n`;
      }

      if (executionResult.error) {
        outputText += `Error:\n${executionResult.error}`;
        setResultType("error");
      } else {
        outputText += `Output:\n${executionResult.output || "(No output)"}`;
        if (executionResult.executionTime) {
          outputText += `\n\nExecution Time: ${executionResult.executionTime}`;
        }
        if (executionResult.memory) {
          outputText += `\nMemory Used: ${(executionResult.memory / 1024).toFixed(2)} MB`;
        }
        setResultType("success");
      }

      setResult(outputText);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setResultType("error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-card rounded-2xl overflow-hidden border border-border">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border">
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-foreground">Language:</label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:border-ring transition-colors"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "vs-dark" ? "vs-light" : "vs-dark")}
            className="p-2 rounded-lg bg-background hover:bg-muted transition-colors"
            title="Toggle Theme"
          >
            {theme === "vs-dark" ? (
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Compile Button - Placeholder for Judge0 integration */}
          <button 
            onClick={handleCompile}
            disabled={isCompiling}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isCompiling ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Compile
          </button>

          {/* Run Button - Placeholder for Judge0 integration */}
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Run
          </button>

          {/* Share with AI Button */}
          {onShareWithAI && (
            <button
              onClick={() => onShareWithAI(code, language)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Share with AI
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-destructive hover:text-destructive-foreground text-foreground font-semibold rounded-lg transition-colors border border-border"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* Main Content - Editor + Output Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Output Panel - Left Side */}
        {showOutput && (
          <div className="w-72 bg-muted border-r border-border flex flex-col">
            <div className="px-4 py-3 bg-muted border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Output
              </h3>
              <button
                onClick={() => setShowOutput(false)}
                className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {result ? (
                <div className={`text-sm font-mono whitespace-pre-wrap ${resultType === "error" ? "text-destructive" : resultType === "success" ? "text-green-600" : "text-foreground"}`}>
                  {result}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm italic">
                  Click Compile or Run to see results here...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor - Right Side */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={theme}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              padding: { top: 16 },
              fontFamily: "'Fira Code', 'Consolas', monospace",
              fontLigatures: true,
              cursorBlinking: "smooth",
              smoothScrolling: true,
              contextmenu: true,
              multiCursorModifier: "ctrlCmd",
              wordWrap: "on",
              folding: true,
              renderWhitespace: "selection",
              bracketPairColorization: { enabled: true },
              formatOnPaste: true,
              formatOnType: true,
              suggest: {
                showKeywords: true,
                showSnippets: true,
                showFunctions: true,
                showVariables: true,
              },
            }}
            loading={
              <div className="flex items-center justify-center h-full text-light-100">
                <span className="w-6 h-6 border-2 border-primary-200 border-t-transparent rounded-full animate-spin mr-2" />
                Loading Editor...
              </div>
            }
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-dark-200 border-t border-dark-200 text-xs text-light-100">
        <div className="flex items-center gap-4">
          <span>{language.charAt(0).toUpperCase() + language.slice(1)}</span>
          <span>UTF-8</span>
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus === "online"
                  ? "bg-success-100"
                  : serverStatus === "offline"
                  ? "bg-destructive-100"
                  : "bg-yellow-500 animate-pulse"
              }`}
            />
            <span className="text-light-400">
              {serverStatus === "online"
                ? "Server Online"
                : serverStatus === "offline"
                ? "Server Offline"
                : "Checking..."}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>{resultType === "success" ? "✓ Success" : resultType === "error" ? "✗ Error" : "Ready"}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
