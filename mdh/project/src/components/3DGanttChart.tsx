import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Task {
  id: string;
  name: string;
  duration: number;
  progress: number;
  startDate: string;
  endDate: string;
  dependencies?: string[];
  color?: string;
}

interface Gantt3DProps {
  tasks: Task[];
  width?: number;
  height?: number;
}

const Gantt3DChart: React.FC<Gantt3DProps> = ({ 
  tasks, 
  width = 800, 
  height = 600 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene oluştur
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera oluştur
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(50, 30, 50);

    // Renderer oluştur
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Controls ekle
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Işık ekle
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Grid ekle
    const gridHelper = new THREE.GridHelper(100, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Eksenler ekle
    const axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);

    // Task'ları 3D olarak oluştur
    create3DTasks(scene, tasks);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (renderer) {
        renderer.dispose();
      }
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [tasks, width, height]);

  const create3DTasks = (scene: THREE.Scene, tasks: Task[]) => {
    const colors = [
      0x4285f4, 0xea4335, 0xfbbc04, 0x34a853,
      0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4
    ];

    tasks.forEach((task, index) => {
      const taskGroup = new THREE.Group();
      
      // Task bloğu oluştur
      const taskWidth = Math.max(task.duration * 0.5, 2);
      const taskHeight = 2;
      const taskDepth = 4;
      
      const geometry = new THREE.BoxGeometry(taskWidth, taskHeight, taskDepth);
      const material = new THREE.MeshLambertMaterial({ 
        color: task.color ? parseInt(task.color.replace('#', '0x')) : colors[index % colors.length],
        transparent: true,
        opacity: 0.8
      });
      
      const taskMesh = new THREE.Mesh(geometry, material);
      taskMesh.castShadow = true;
      taskMesh.receiveShadow = true;
      
      // Task pozisyonu
      const x = index * 8 - (tasks.length - 1) * 4;
      const y = taskHeight / 2;
      const z = 0;
      
      taskMesh.position.set(x, y, z);
      
      // Progress gösterimi
      if (task.progress > 0) {
        const progressGeometry = new THREE.BoxGeometry(
          taskWidth * (task.progress / 100), 
          taskHeight, 
          taskDepth
        );
        const progressMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x00ff00,
          transparent: true,
          opacity: 0.9
        });
        
        const progressMesh = new THREE.Mesh(progressGeometry, progressMaterial);
        progressMesh.position.set(
          -(taskWidth * (1 - task.progress / 100)) / 2,
          0,
          0
        );
        taskMesh.add(progressMesh);
      }
      
      // Task etiketi
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = '16px Arial';
        context.textAlign = 'center';
        context.fillText(task.name, canvas.width / 2, 20);
        context.fillText(`${task.progress}%`, canvas.width / 2, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelGeometry = new THREE.PlaneGeometry(8, 2);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
          map: texture,
          transparent: true
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, taskHeight + 1, 0);
        taskMesh.add(label);
      }
      
      // Hover efekti
      taskMesh.userData = { taskId: task.id, taskName: task.name };
      
      taskGroup.add(taskMesh);
      scene.add(taskGroup);
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!rendererRef.current || !sceneRef.current) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / width) * 2 - 1;
    mouse.y = -(event.clientY / height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, rendererRef.current.getCamera());

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      if (intersectedObject.userData.taskId) {
        setSelectedTask(intersectedObject.userData.taskId);
        document.body.style.cursor = 'pointer';
      }
    } else {
      setSelectedTask(null);
      document.body.style.cursor = 'default';
    }
  };

  return (
    <div className="gantt-3d-container">
      <div 
        ref={mountRef}
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        className="gantt-3d-canvas"
      />
      {selectedTask && (
        <div className="task-tooltip">
          Seçili Task: {selectedTask}
        </div>
      )}
      <div className="gantt-controls">
        <button onClick={() => controlsRef.current?.reset()}>
          Kamera Sıfırla
        </button>
        <button onClick={() => {
          if (rendererRef.current) {
            const camera = rendererRef.current.getCamera();
            camera.position.set(50, 30, 50);
            camera.lookAt(0, 0, 0);
          }
        }}>
          Varsayılan Görünüm
        </button>
      </div>
    </div>
  );
};

export default Gantt3DChart;
