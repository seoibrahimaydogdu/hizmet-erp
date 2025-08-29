import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './3DGanttChart.css';

interface Task {
  id: string;
  name: string;
  duration: number;
  progress: number;
  startDate: string;
  endDate: string;
  dependencies?: string[];
  color?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
}

interface AdvancedGantt3DProps {
  tasks: Task[];
  width?: number;
  height?: number;
  showDependencies?: boolean;
  showTimeline?: boolean;
}

const Advanced3DGanttChart: React.FC<AdvancedGantt3DProps> = ({ 
  tasks, 
  width = 1000, 
  height = 700,
  showDependencies = true,
  showTimeline = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'top' | 'side'>('3d');

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene oluştur
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);
    scene.fog = new THREE.Fog(0xf8f9fa, 50, 200);
    sceneRef.current = scene;

    // Camera oluştur
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(80, 50, 80);
    cameraRef.current = camera;

    // Renderer oluştur
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Controls ekle
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 20;
    controls.maxDistance = 200;
    controlsRef.current = controls;

    // Işıklandırma sistemi
    setupLighting(scene);

    // Grid ve eksenler
    setupGridAndAxes(scene);

    // Timeline oluştur
    if (showTimeline) {
      createTimeline(scene, tasks);
    }

    // Task'ları 3D olarak oluştur
    create3DTasks(scene, tasks);

    // Bağımlılıkları göster
    if (showDependencies) {
      createDependencies(scene, tasks);
    }

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
  }, [tasks, width, height, showDependencies, showTimeline]);

  const setupLighting = (scene: THREE.Scene) => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Directional light (ana ışık)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Point light (spotlight efekti)
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(-30, 30, -30);
    scene.add(pointLight);
  };

  const setupGridAndAxes = (scene: THREE.Scene) => {
    // Grid
    const gridHelper = new THREE.GridHelper(200, 40, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Eksenler
    const axesHelper = new THREE.AxesHelper(30);
    scene.add(axesHelper);

    // Eksen etiketleri
    const createAxisLabel = (text: string, position: THREE.Vector3, color: number) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 128;
        canvas.height = 32;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = '16px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, 20);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelGeometry = new THREE.PlaneGeometry(4, 1);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
          map: texture,
          transparent: true
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.copy(position);
        scene.add(label);
      }
    };

    createAxisLabel('Zaman', new THREE.Vector3(0, 0, 50), 0xff0000);
    createAxisLabel('Task', new THREE.Vector3(50, 0, 0), 0x00ff00);
    createAxisLabel('İlerleme', new THREE.Vector3(0, 50, 0), 0x0000ff);
  };

  const createTimeline = (scene: THREE.Scene, tasks: Task[]) => {
    const timelineGroup = new THREE.Group();
    
    // Timeline çizgisi
    const timelineGeometry = new THREE.BoxGeometry(200, 0.5, 0.5);
    const timelineMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const timeline = new THREE.Mesh(timelineGeometry, timelineMaterial);
    timeline.position.set(0, 0, -30);
    timelineGroup.add(timeline);

    // Timeline işaretleri
    const maxDuration = Math.max(...tasks.map(t => t.duration));
    for (let i = 0; i <= maxDuration; i += 10) {
      const markerGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
      const markerMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(i - maxDuration / 2, 1, -30);
      timelineGroup.add(marker);

      // Zaman etiketi
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 64;
        canvas.height = 32;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#333333';
        context.font = '12px Arial';
        context.textAlign = 'center';
        context.fillText(`${i}g`, canvas.width / 2, 20);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelGeometry = new THREE.PlaneGeometry(2, 1);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
          map: texture,
          transparent: true
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(i - maxDuration / 2, 3, -30);
        timelineGroup.add(label);
      }
    }

    scene.add(timelineGroup);
  };

  const create3DTasks = (scene: THREE.Scene, tasks: Task[]) => {
    const colors = [
      0x4285f4, 0xea4335, 0xfbbc04, 0x34a853,
      0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4,
      0xff9ff3, 0x54a0ff, 0x5f27cd, 0x00d2d3
    ];

    const maxDuration = Math.max(...tasks.map(t => t.duration));

    tasks.forEach((task, index) => {
      const taskGroup = new THREE.Group();
      
      // Task boyutları
      const taskWidth = Math.max(task.duration * 0.8, 3);
      const taskHeight = 3;
      const taskDepth = 6;
      
      // Ana task bloğu
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
      const x = (task.duration / 2) - (maxDuration / 2);
      const y = taskHeight / 2;
      const z = index * 10 - (tasks.length - 1) * 5;
      
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
      createTaskLabel(taskMesh, task, taskHeight);
      
      // Priority göstergesi
      if (task.priority) {
        createPriorityIndicator(taskMesh, task.priority, taskHeight);
      }
      
      // Hover ve click için userData
      taskMesh.userData = { 
        taskId: task.id, 
        task: task,
        type: 'task'
      };
      
      taskGroup.add(taskMesh);
      scene.add(taskGroup);
    });
  };

  const createTaskLabel = (taskMesh: THREE.Mesh, task: Task, taskHeight: number) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#000000';
      context.font = '14px Arial';
      context.textAlign = 'center';
      
      // Task adını kısalt
      const shortName = task.name.length > 20 ? task.name.substring(0, 20) + '...' : task.name;
      context.fillText(shortName, canvas.width / 2, 20);
      context.fillText(`${task.progress}%`, canvas.width / 2, 40);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelGeometry = new THREE.PlaneGeometry(10, 2.5);
      const labelMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true
      });
      
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(0, taskHeight + 2, 0);
      taskMesh.add(label);
    }
  };

  const createPriorityIndicator = (taskMesh: THREE.Mesh, priority: string, taskHeight: number) => {
    const colors = {
      low: 0x00ff00,
      medium: 0xffff00,
      high: 0xff0000
    };
    
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshLambertMaterial({ 
      color: colors[priority as keyof typeof colors],
      emissive: colors[priority as keyof typeof colors],
      emissiveIntensity: 0.3
    });
    
    const indicator = new THREE.Mesh(geometry, material);
    indicator.position.set(0, taskHeight + 4, 0);
    taskMesh.add(indicator);
  };

  const createDependencies = (scene: THREE.Scene, tasks: Task[]) => {
    tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          const sourceTask = tasks.find(t => t.id === depId);
          if (sourceTask) {
            const sourceIndex = tasks.findIndex(t => t.id === depId);
            const targetIndex = tasks.findIndex(t => t.id === task.id);
            
            const maxDuration = Math.max(...tasks.map(t => t.duration));
            const sourceX = (sourceTask.duration / 2) - (maxDuration / 2);
            const sourceZ = sourceIndex * 10 - (tasks.length - 1) * 5;
            const targetX = (task.duration / 2) - (maxDuration / 2);
            const targetZ = targetIndex * 10 - (tasks.length - 1) * 5;
            
            // Bağımlılık çizgisi
            const points = [];
            points.push(new THREE.Vector3(sourceX + sourceTask.duration * 0.4, 3, sourceZ));
            points.push(new THREE.Vector3(targetX - task.duration * 0.4, 3, targetZ));
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ 
              color: 0xff0000,
              linewidth: 2
            });
            
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            
            // Ok işareti
            const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);
            const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            
            const direction = new THREE.Vector3().subVectors(points[1], points[0]).normalize();
            arrow.position.copy(points[1]);
            arrow.lookAt(points[0]);
            arrow.rotateX(Math.PI / 2);
            
            scene.add(arrow);
          }
        });
      }
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!rendererRef.current || !sceneRef.current) return;

    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    const camera = cameraRef.current;
    if (camera) {
      raycaster.setFromCamera(mouse, camera);
    }

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      if (intersectedObject.userData.type === 'task') {
        setHoveredTask(intersectedObject.userData.task);
        document.body.style.cursor = 'pointer';
      }
    } else {
      setHoveredTask(null);
      document.body.style.cursor = 'default';
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    if (!rendererRef.current || !sceneRef.current) return;

    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    const camera = cameraRef.current;
    if (camera) {
      raycaster.setFromCamera(mouse, camera);
    }

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      if (intersectedObject.userData.type === 'task') {
        setSelectedTask(intersectedObject.userData.task);
      }
    }
  };

  const changeViewMode = (mode: '3d' | 'top' | 'side') => {
    if (!cameraRef.current) return;
    
    const camera = cameraRef.current;
    setViewMode(mode);
    
    switch (mode) {
      case '3d':
        camera.position.set(80, 50, 80);
        break;
      case 'top':
        camera.position.set(0, 100, 0);
        break;
      case 'side':
        camera.position.set(100, 0, 0);
        break;
    }
    
    camera.lookAt(0, 0, 0);
  };

  return (
    <div className="gantt-3d-container">
      <div className="gantt-3d-header">
        <h2>🌐 3D Gantt Chart</h2>
        <p>Proje zaman çizelgesi 3D görünümde</p>
      </div>
      
      <div 
        ref={mountRef}
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="gantt-3d-canvas"
      />
      
      {hoveredTask && (
        <div className="task-tooltip">
          {hoveredTask.name} - {hoveredTask.progress}%
        </div>
      )}
      
      {selectedTask && (
        <div className="task-info-panel">
          <h3>Task Detayları</h3>
          <div className="task-info-item">
            <span className="task-info-label">Ad:</span>
            <span className="task-info-value">{selectedTask.name}</span>
          </div>
          <div className="task-info-item">
            <span className="task-info-label">Süre:</span>
            <span className="task-info-value">{selectedTask.duration} gün</span>
          </div>
          <div className="task-info-item">
            <span className="task-info-label">İlerleme:</span>
            <span className="task-info-value">{selectedTask.progress}%</span>
          </div>
          <div className="task-info-item">
            <span className="task-info-label">Başlangıç:</span>
            <span className="task-info-value">{selectedTask.startDate}</span>
          </div>
          <div className="task-info-item">
            <span className="task-info-label">Bitiş:</span>
            <span className="task-info-value">{selectedTask.endDate}</span>
          </div>
          {selectedTask.priority && (
            <div className="task-info-item">
              <span className="task-info-label">Öncelik:</span>
              <span className="task-info-value">{selectedTask.priority}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="gantt-controls">
        <button onClick={() => controlsRef.current?.reset()}>
          🔄 Kamera Sıfırla
        </button>
        <button onClick={() => changeViewMode('3d')}>
          📊 3D Görünüm
        </button>
        <button onClick={() => changeViewMode('top')}>
          👁️ Üstten Görünüm
        </button>
        <button onClick={() => changeViewMode('side')}>
          👁️ Yandan Görünüm
        </button>
      </div>
    </div>
  );
};

export default Advanced3DGanttChart;
