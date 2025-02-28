import * as THREE from 'three';
import { Enemy } from '../components/Enemy.js';
import { EventEmitter } from '../utils/EventEmitter.js';

export class EnemyManager extends EventEmitter {
    constructor(scene) {
        super();
        this.scene = scene;
        this.enemies = new Set();
        this.spawnTimer = 0;
        this.spawnInterval = 3;
        this.difficulty = 1;
        this.baseSpeed = 2;
        this.damageAmount = 20; // Reduced from instant kill
    }

    update(delta, playerPosition) {
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
            this.increaseDifficulty();
        }

        this.enemies.forEach(enemy => {
            const directionToPlayer = new THREE.Vector3()
                .subVectors(playerPosition, enemy.position)
                .normalize();
            
            enemy.position.add(
                directionToPlayer.multiplyScalar(2 * delta * this.difficulty)
            );
            
            enemy.rotation.x += delta;
            enemy.rotation.y += delta;
        });
    }

    spawnEnemy() {
        const types = ['chaser', 'shooter', 'bomber'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const enemy = new THREE.Mesh(
            this.getEnemyGeometry(type),
            new THREE.MeshPhongMaterial({
                color: this.getEnemyColor(type),
                emissive: this.getEnemyColor(type),
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            })
        );
        
        enemy.type = type;
        enemy.speed = this.baseSpeed * (type === 'bomber' ? 1.5 : 1);
        enemy.damage = this.getDamageByType(type);
        
        this.positionEnemyAtSpawn(enemy);
        this.scene.add(enemy);
        this.enemies.add(enemy);
    }

    getEnemyGeometry(type) {
        switch(type) {
            case 'shooter': return new THREE.OctahedronGeometry(0.3);
            case 'bomber': return new THREE.DodecahedronGeometry(0.4);
            default: return new THREE.TetrahedronGeometry(0.3);
        }
    }

    getEnemyColor(type) {
        switch(type) {
            case 'shooter': return 0xff6600;
            case 'bomber': return 0xff0066;
            default: return 0xff0000;
        }
    }

    getDamageByType(type) {
        switch(type) {
            case 'shooter': return 15;
            case 'bomber': return 30;
            default: return 20;
        }
    }

    positionEnemyAtSpawn(enemy) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 5;
        enemy.position.set(
            Math.cos(angle) * distance,
            (Math.random() - 0.5) * 10,
            Math.sin(angle) * distance
        );
    }

    increaseDifficulty() {
        this.difficulty += 0.05;
        this.spawnInterval = Math.max(1, this.spawnInterval * 0.95);
    }

    clear() {
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies.clear();
    }
}