/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import * as THREE from "three";
import React, { useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    BaseHuman_1: THREE.SkinnedMesh;
    BaseHuman_2: THREE.SkinnedMesh;
    BaseHuman_3: THREE.SkinnedMesh;
    BaseHuman_4: THREE.SkinnedMesh;
    BaseHuman_5: THREE.SkinnedMesh;
    BaseHuman_6: THREE.SkinnedMesh;
    Bone: THREE.Bone;
  };
  materials: {
    Shirt: THREE.MeshStandardMaterial;
    Skin: THREE.MeshStandardMaterial;
    Pants: THREE.MeshStandardMaterial;
    Eyes: THREE.MeshStandardMaterial;
    Socks: THREE.MeshStandardMaterial;
    Hair: THREE.MeshStandardMaterial;
  };
};

export function Hero(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF("/player.glb") as GLTFResult;
  return (
    <group {...props} dispose={null} scale={0.5} position={[0, -0.8, 0]}>
      <group name="Root_Scene">
        <group name="RootNode">
          <group
            name="HumanArmature"
            rotation={[-Math.PI / 2, 0, 0]}
            scale={100}
          >
            <primitive object={nodes.Bone} />
          </group>
          <group name="BaseHuman" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
            <skinnedMesh
              name="BaseHuman_1"
              geometry={nodes.BaseHuman_1.geometry}
              material={materials.Shirt}
              skeleton={nodes.BaseHuman_1.skeleton}
            />
            <skinnedMesh
              name="BaseHuman_2"
              geometry={nodes.BaseHuman_2.geometry}
              material={materials.Skin}
              skeleton={nodes.BaseHuman_2.skeleton}
            />
            <skinnedMesh
              name="BaseHuman_3"
              geometry={nodes.BaseHuman_3.geometry}
              material={materials.Pants}
              skeleton={nodes.BaseHuman_3.skeleton}
            />
            <skinnedMesh
              name="BaseHuman_4"
              geometry={nodes.BaseHuman_4.geometry}
              material={materials.Eyes}
              skeleton={nodes.BaseHuman_4.skeleton}
            />
            <skinnedMesh
              name="BaseHuman_5"
              geometry={nodes.BaseHuman_5.geometry}
              material={materials.Socks}
              skeleton={nodes.BaseHuman_5.skeleton}
            />
            <skinnedMesh
              name="BaseHuman_6"
              geometry={nodes.BaseHuman_6.geometry}
              material={materials.Hair}
              skeleton={nodes.BaseHuman_6.skeleton}
            />
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/player.glb");
