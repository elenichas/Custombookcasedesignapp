import { BookcaseConfig, DrawerConfig } from './Bookcase';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Plus, X, Box, GlassWater } from 'lucide-react';

interface ConfigPanelProps {
  config: BookcaseConfig;
  onConfigChange: (config: BookcaseConfig) => void;
  onExport?: () => void;
}

const colorPresets = [
  { name: 'Oak', value: '#daa520' },
  { name: 'Walnut', value: '#5c4033' },
  { name: 'White', value: '#f5f5f5' },
  { name: 'Black', value: '#2c2c2c' },
  { name: 'Gray', value: '#808080' },
  { name: 'Cherry', value: '#8b4513' },
];

export function ConfigPanel({ config, onConfigChange, onExport }: ConfigPanelProps) {
  const updateConfig = (key: keyof BookcaseConfig, value: number | string | DrawerConfig[]) => {
    onConfigChange({ ...config, [key]: value });
  };

  const addDrawer = (row: number, column: number, type: 'solid' | 'glass') => {
    const newDrawer: DrawerConfig = { row, column, type };
    const updatedDrawers = [...config.drawers, newDrawer];
    updateConfig('drawers', updatedDrawers);
  };

  const removeDrawer = (index: number) => {
    const updatedDrawers = config.drawers.filter((_, i) => i !== index);
    updateConfig('drawers', updatedDrawers);
  };

  const toggleDrawerType = (index: number) => {
    const updatedDrawers = config.drawers.map((drawer, i) => 
      i === index ? { ...drawer, type: drawer.type === 'solid' ? 'glass' as const : 'solid' as const } : drawer
    );
    updateConfig('drawers', updatedDrawers);
  };

  return (
    <Card className="w-full h-full bg-white/95 backdrop-blur-sm border-gray-200">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl mb-2">Bookcase Designer</h2>
            <p className="text-sm text-gray-600">
              Customize your bookcase dimensions and layout
            </p>
          </div>

          <Separator />

          {/* Dimensions Section */}
          <div className="space-y-4">
            <h3 className="text-lg">Dimensions</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="width">Width</Label>
                <span className="text-sm text-gray-600">{config.width.toFixed(1)}m</span>
              </div>
              <Slider
                id="width"
                min={1}
                max={5}
                step={0.1}
                value={[config.width]}
                onValueChange={([value]) => updateConfig('width', value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="height">Height</Label>
                <span className="text-sm text-gray-600">{config.height.toFixed(1)}m</span>
              </div>
              <Slider
                id="height"
                min={1}
                max={4}
                step={0.1}
                value={[config.height]}
                onValueChange={([value]) => updateConfig('height', value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="depth">Depth</Label>
                <span className="text-sm text-gray-600">{config.depth.toFixed(1)}m</span>
              </div>
              <Slider
                id="depth"
                min={0.2}
                max={0.8}
                step={0.05}
                value={[config.depth]}
                onValueChange={([value]) => updateConfig('depth', value)}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          {/* Layout Section */}
          <div className="space-y-4">
            <h3 className="text-lg">Layout</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shelves">Shelves</Label>
                <span className="text-sm text-gray-600">{config.shelves}</span>
              </div>
              <Slider
                id="shelves"
                min={1}
                max={8}
                step={1}
                value={[config.shelves]}
                onValueChange={([value]) => updateConfig('shelves', value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="divisions">Vertical Divisions</Label>
                <span className="text-sm text-gray-600">{config.divisions}</span>
              </div>
              <Slider
                id="divisions"
                min={1}
                max={6}
                step={1}
                value={[config.divisions]}
                onValueChange={([value]) => updateConfig('divisions', value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="thickness">Material Thickness</Label>
                <span className="text-sm text-gray-600">{(config.thickness * 100).toFixed(0)}cm</span>
              </div>
              <Slider
                id="thickness"
                min={0.02}
                max={0.08}
                step={0.01}
                value={[config.thickness]}
                onValueChange={([value]) => updateConfig('thickness', value)}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          {/* Drawers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg">Drawers & Doors</h3>
              <span className="text-xs text-gray-500">{config.drawers.length} added</span>
            </div>
            
            {/* Compartment Grid */}
            <div className="space-y-2">
              <Label>Click a compartment to add a drawer</Label>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div 
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${config.divisions + 1}, 1fr)`,
                    gridTemplateRows: `repeat(${config.shelves + 1}, 1fr)`,
                  }}
                >
                  {Array.from({ length: (config.shelves + 1) * (config.divisions + 1) }).map((_, index) => {
                    const row = Math.floor(index / (config.divisions + 1));
                    const column = index % (config.divisions + 1);
                    const actualRow = config.shelves - row; // Flip vertically so bottom is 0
                    const hasDrawer = config.drawers.findIndex(d => d.row === actualRow && d.column === column);
                    const drawer = hasDrawer >= 0 ? config.drawers[hasDrawer] : null;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (hasDrawer >= 0) {
                            toggleDrawerType(hasDrawer);
                          } else {
                            addDrawer(actualRow, column, 'solid');
                          }
                        }}
                        className={`
                          aspect-square rounded border-2 transition-all relative
                          ${drawer 
                            ? drawer.type === 'solid'
                              ? 'bg-amber-100 border-amber-400 hover:bg-amber-200' 
                              : 'bg-blue-100 border-blue-400 hover:bg-blue-200'
                            : 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }
                        `}
                        title={drawer ? `${drawer.type === 'solid' ? 'Solid' : 'Glass'} drawer - Click to toggle` : 'Click to add drawer'}
                      >
                        {drawer && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {drawer.type === 'solid' ? (
                              <Box className="w-4 h-4" />
                            ) : (
                              <GlassWater className="w-4 h-4" />
                            )}
                          </div>
                        )}
                        {drawer && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDrawer(hasDrawer);
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-amber-400 bg-amber-100"></div>
                  <span>Solid</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border-2 border-blue-400 bg-blue-100"></div>
                  <span>Glass</span>
                </div>
              </div>
            </div>

            {/* Drawer List */}
            {config.drawers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Active Drawers</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {config.drawers.map((drawer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        {drawer.type === 'solid' ? (
                          <Box className="w-4 h-4 text-amber-600" />
                        ) : (
                          <GlassWater className="w-4 h-4 text-blue-600" />
                        )}
                        <span>
                          Row {drawer.row + 1}, Col {drawer.column + 1} - {drawer.type === 'solid' ? 'Solid' : 'Glass'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDrawer(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Color Section */}
          <div className="space-y-4">
            <h3 className="text-lg">Material & Color</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => updateConfig('color', preset.value)}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${config.color === preset.value 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div
                    className="w-full h-8 rounded mb-1"
                    style={{ backgroundColor: preset.value }}
                  />
                  <span className="text-xs">{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customColor">Custom Color</Label>
              <div className="flex gap-2">
                <Input
                  id="customColor"
                  type="color"
                  value={config.color}
                  onChange={(e) => updateConfig('color', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.color}
                  onChange={(e) => updateConfig('color', e.target.value)}
                  className="flex-1"
                  placeholder="#daa520"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Summary Section */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm">Configuration Summary</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Dimensions: {config.width.toFixed(1)}m × {config.height.toFixed(1)}m × {config.depth.toFixed(1)}m</p>
              <p>• Total Compartments: {(config.shelves + 1) * (config.divisions + 1)}</p>
              <p>• Shelves: {config.shelves} horizontal</p>
              <p>• Divisions: {config.divisions} vertical</p>
            </div>
          </div>

          {onExport && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
              >
                Export Configuration
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}