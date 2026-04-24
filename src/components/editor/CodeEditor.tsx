/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  monacoTheme: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, monacoTheme }) => {
  return (
    <div className="flex-grow">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={code}
        onChange={(value) => onChange(value || '')}
        theme={monacoTheme}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          roundedSelection: false,
          padding: { top: 20 },
          fontFamily: 'JetBrains Mono',
          automaticLayout: true,
        }}
      />
    </div>
  );
};
