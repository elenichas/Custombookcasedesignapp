export interface BookcaseConfig {
  width: number;
  height: number;
  depth: number;
  shelves: number;
  divisions: number;
  thickness: number;
  color: string;
  drawers: DrawerConfig[];
}

export interface DrawerConfig {
  row: number; // shelf row (0 = bottom)
  column: number; // division column (0 = left)
  type: 'solid' | 'glass';
}

interface BookcaseProps {
  config: BookcaseConfig;
}

export function Bookcase({ config }: BookcaseProps) {
  const { width, height, depth, shelves, divisions, thickness, color, drawers } = config;

  // Calculate shelf positions
  const shelfPositions: number[] = [];
  for (let i = 0; i <= shelves; i++) {
    const y = (i / shelves) * height - height / 2;
    shelfPositions.push(y);
  }

  // Calculate division positions
  const divisionPositions: number[] = [];
  for (let i = 0; i <= divisions; i++) {
    const x = (i / divisions) * width - width / 2;
    divisionPositions.push(x);
  }

  return (
    <group position={[0, height / 2, 0]}>
      {/* Back panel */}
      <mesh position={[0, 0, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, thickness]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Left side */}
      <mesh position={[-width / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Right side */}
      <mesh position={[width / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Shelves */}
      {shelfPositions.map((y, index) => (
        <mesh key={`shelf-${index}`} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, thickness, depth]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}

      {/* Vertical divisions */}
      {divisionPositions.slice(1, -1).map((x, index) => (
        <mesh key={`division-${index}`} position={[x, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[thickness, height, depth]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}

      {/* Drawers */}
      {drawers.map((drawer, index) => {
        const shelfY = shelfPositions[drawer.row];
        const divisionX = divisionPositions[drawer.column];
        const drawerWidth = divisionPositions[drawer.column + 1] - divisionX;
        const drawerHeight = shelfPositions[drawer.row + 1] - shelfY;
        return (
          <mesh key={`drawer-${index}`} position={[divisionX + drawerWidth / 2, shelfY + drawerHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[drawerWidth, drawerHeight, thickness]} />
            <meshStandardMaterial color={drawer.type === 'solid' ? color : 'white'} />
          </mesh>
        );
      })}
    </group>
  );
}