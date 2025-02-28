import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Player } from './src/components/Player.js';
import { EnemyManager } from './src/systems/EnemyManager.js';

// Move all initialization into a setup function
function initGame() {
    // Scene Setup
    const mainScene = new THREE.Scene();
    mainScene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Controls & Post-processing
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 15;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(mainScene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, 0.4, 0.85
    );
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    mainScene.add(ambientLight);
    mainScene.add(directionalLight);

    // Game State
    const gameState = {
        score: 0,
        health: 100,
        collectibles: [],
        musicIntensity: 0,
        isGameOver: false
    };

    // Add after game state initialization
    function createCollectible() {
        const geometry = new THREE.OctahedronGeometry(0.2);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        const collectible = new THREE.Mesh(geometry, material);
        collectible.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
        );
        gameState.collectibles.push(collectible);
        mainScene.add(collectible);
    }

    // Initialize Systems
    const clock = new THREE.Clock();
    const player = new Player(mainScene);
    const enemyManager = new EnemyManager(mainScene);
    createStarfield();

    // Initialize collectibles
    for (let i = 0; i < 10; i++) {
        createCollectible();
    }

    // Event Listeners
    const keys = {};
    document.addEventListener('keydown', (event) => keys[event.key] = true);
    document.addEventListener('keyup', (event) => keys[event.key] = false);

    player.on('healthChanged', () => updateHUD());
    player.on('died', () => gameState.isGameOver = true);

    // Game Functions
    function createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        const starCount = 5000;

        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starVertices.push(x, y, z);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        mainScene.add(new THREE.Points(starGeometry, starMaterial));
    }

    // Add visual feedback functions
    function createCollectEffect(position) {
        const particles = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                color: 0xffff00,
                size: 0.1,
                transparent: true
            })
        );
        // Add particle effect animation
        mainScene.add(particles);
        setTimeout(() => mainScene.remove(particles), 500);
    }

    function createDamageEffect(position) {
        const flash = new THREE.PointLight(0xff0000, 1, 10);
        flash.position.copy(position);
        mainScene.add(flash);
        setTimeout(() => mainScene.remove(flash), 200);
    }

    function updateHUD() {
        document.getElementById('score').textContent = `Score: ${player.stats.score}`;
        document.getElementById('health').textContent = `Health: ${player.stats.health}%`;
        document.getElementById('stamina').textContent = `Stamina: ${Math.floor(player.stats.stamina)}%`;
    }

    function checkCollisions() {
        // Check collectibles
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            const collectible = gameState.collectibles[i];
            if (player.getPosition().distanceTo(collectible.position) < 1) {
                mainScene.remove(collectible);
                gameState.collectibles.splice(i, 1);
                player.addScore(10);
                createCollectible(); // Spawn new collectible
                updateHUD();
                
                // Visual feedback
                createCollectEffect(collectible.position);
            }
        }

        // Check enemy collisions
        enemyManager.enemies.forEach(enemy => {
            if (player.getPosition().distanceTo(enemy.position) < 1) {
                player.takeDamage(10);
                updateHUD();
                
                // Visual feedback
                createDamageEffect(player.mesh.position);
            }
        });
    }

    // Animation Loop
    function animate() {
        if (gameState.isGameOver) {
            document.getElementById('gameOver').style.display = 'block';
            return;
        }

        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        player.update(delta, keys);
        enemyManager.update(delta, player.getPosition());
        checkCollisions();
        controls.update();
        composer.render();
    }

    // Window Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    // Start animation loop
    animate();
}

// Move game start to DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});