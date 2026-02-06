export function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#d4c4b0" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 5, -5]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color="#e8e4df" 
          roughness={0.9}
        />
      </mesh>

      {/* Left wall */}
      <mesh position={[-10, 5, 5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color="#ebe7e2" 
          roughness={0.9}
        />
      </mesh>

      {/* Right wall */}
      <mesh position={[10, 5, 5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color="#ebe7e2" 
          roughness={0.9}
        />
      </mesh>

      {/* Ambient decoration - a simple rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 3]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial 
          color="#8b7355" 
          roughness={1}
        />
      </mesh>

      {/* Simple side table */}
      <group position={[4, 0, 2]}>
        {/* Table top */}
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[1.2, 0.1, 0.8]} />
          <meshStandardMaterial color="#5a4a3a" />
        </mesh>
        {/* Table legs */}
        {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.5, z]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1]} />
            <meshStandardMaterial color="#5a4a3a" />
          </mesh>
        ))}
      </group>

      {/* Decorative plant */}
      <group position={[4, 1.1, 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.2, 0.3, 8]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshStandardMaterial color="#2d5016" />
        </mesh>
      </group>
    </group>
  );
}
