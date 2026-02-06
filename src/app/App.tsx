import { useState, useRef } from 'react';
import { BookcaseViewer, BookcaseViewerRef } from './components/BookcaseViewer';
import { ConfigPanel } from './components/ConfigPanel';
import { BookcaseConfig } from './components/Bookcase';
import { Settings, RotateCcw, Download } from 'lucide-react';
import { Button } from './components/ui/button';

const defaultConfig: BookcaseConfig = {
  width: 2.5,
  height: 2.4,
  depth: 0.4,
  shelves: 4,
  divisions: 2,
  thickness: 0.04,
  color: '#daa520',
  drawers: [],
};

export default function App() {
  const [config, setConfig] = useState<BookcaseConfig>(defaultConfig);
  const [panelVisible, setPanelVisible] = useState(true);
  const viewerRef = useRef<BookcaseViewerRef>(null);

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  const handleExportOBJ = () => {
    if (viewerRef.current) {
      viewerRef.current.exportAsOBJ();
    }
  };

  const downloadConfig = () => {
    const configJson = JSON.stringify(config, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookcase_config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">Bookcase Configurator</h1>
              <p className="text-sm text-gray-600">Design your custom bookcase in 3D</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetConfig}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPanelVisible(!panelVisible)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {panelVisible ? 'Hide' : 'Show'} Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadConfig}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Config
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportOBJ}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export OBJ
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-full pt-20">
        {/* 3D Viewer */}
        <div 
          className={`flex-1 transition-all duration-300 ${
            panelVisible ? 'mr-96' : 'mr-0'
          }`}
        >
          <BookcaseViewer config={config} onConfigChange={setConfig} ref={viewerRef} />
        </div>

        {/* Configuration Panel */}
        <div 
          className={`
            fixed right-0 top-20 bottom-0 w-96 
            transition-transform duration-300 ease-in-out
            ${panelVisible ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="h-full p-4">
            <ConfigPanel config={config} onConfigChange={setConfig} />
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="absolute bottom-4 left-4 bg-black/60 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
        <p className="font-medium mb-1">Controls:</p>
        <ul className="text-xs space-y-0.5 opacity-90">
          <li>• Left click + drag: Rotate view</li>
          <li>• Right click + drag: Pan view</li>
          <li>• Scroll: Zoom in/out</li>
          <li>• Click bookcase: Drag to move</li>
          <li>• Click compartment: Add/toggle drawer</li>
        </ul>
      </div>
    </div>
  );
}