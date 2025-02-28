import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

export class Enemy extends EventEmitter {
    constructor(scene, type = 'chaser', difficulty = 1) {
        super();
        this.scene = scene;
        this.type = type;
        this.difficulty = difficulty;
        this.init();
        this.setupStats();
    }

    init() {
        const geometry = this.getGeometryByType();
        const material = new THREE.MeshPhongMaterial({
            color: this.getColorByType(),
            emissive: this.getColorByType(),
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.setupPosition();
        this.scene.add(this.mesh);
    }

    getGeometryByType() {
        switch(this.type) {
            case 'shooter':
                return new THREE.OctahedronGeometry(0.3);
            case 'bomber':
                return new THREE.DodecahedronGeometry(0.4);
            case 'chaser':
            default:
                return new THREE.TetrahedronGeometry(0.3);
        }
    }

    getColorByType() {
        switch(this.type) {
            case 'shooter':
                return 0xff6600;
            case 'bomber':
                return 0xff0066;
            case 'chaser':
            default:
                return 0xff0000;
        }
    }

    setupStats() {
        const baseStats = {
            chaser: { speed: 2, health: 100, damage: 10 },
            shooter: { speed: 1, health: 80, damage: 15 },
            bomber: { speed: 1.5, health: 50, damage: 30 }
        };

        const stats = baseStats[this.type];
        this.stats = {
            speed: stats.speed * this.difficulty,
            health: stats.health * this.difficulty,
            damage: stats.damage * this.difficulty,
            attackCooldown: 0,
            attackRange: this.type === 'shooter' ? 8 : 1.5
        };
    }

    setupPosition() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 5;
        this.mesh.position.set(
            Math.cos(angle) * distance,
            (Math.random() - 0.5) * 10,
            Math.sin(angle) * distance
        );
        this.velocity = new THREE.Vector3();
    }

    update(delta, playerPosition) {
        this.updateCooldowns(delta);
        this.updateBehavior(delta, playerPosition);
        this.updateEffects(delta);
    }

    updateCooldowns(delta) {
        if (this.stats.attackCooldown > 0) {
            this.stats.attackCooldown -= delta;
        }
    }

    updateBehavior(delta, playerPosition) {
        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        const directionToPlayer = new THREE.Vector3()
            .subVectors(playerPosition, this.mesh.position)
            .normalize();

        switch(this.type) {
            case 'shooter':
                this.updateShooterBehavior(delta, directionToPlayer, distanceToPlayer);
                break;
            case 'bomber':
                this.updateBomberBehavior(delta, directionToPlayer, distanceToPlayer);
                break;
            case 'chaser':
            default:
                this.updateChaserBehavior(delta, directionToPlayer);
        }
    }

    updateShooterBehavior(delta, directionToPlayer, distanceToPlayer) {
        // Keep distance and shoot
        const idealDistance = 6;
        const moveDirection = distanceToPlayer < idealDistance ? 
            directionToPlayer.clone().negate() : 
            directionToPlayer;
        
        this.velocity.copy(moveDirection)
            .multiplyScalar(this.stats.speed * delta);

        if (distanceToPlayer < this.stats.attackRange && this.stats.attackCooldown <= 0) {
            this.shoot(directionToPlayer);
            this.stats.attackCooldown = 2;
        }
    }

    updateBomberBehavior(delta, directionToPlayer, distanceToPlayer) {
        // Rush and explode
        this.velocity.copy(directionToPlayer)
            .multiplyScalar(this.stats.speed * delta);

        if (distanceToPlayer < this.stats.attackRange) {
            this.explode();
        }
    }

    updateChaserBehavior(delta, directionToPlayer) {
        // Direct chase
        this.velocity.copy(directionToPlayer)
            .multiplyScalar(this.stats.speed * delta);
    }

    updateEffects(delta) {
        this.mesh.position.add(this.velocity);
        this.mesh.rotation.x += delta;
        this.mesh.rotation.y += delta;

        // Pulsing effect
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
        this.mesh.scale.setScalar(scale);
    }

    shoot(direction) {
        this.emit('shoot', {
            position: this.mesh.position.clone(),
            direction: direction.clone(),
            damage: this.stats.damage
        });
    }

    explode() {
        this.emit('explode', {
            position: this.mesh.position.clone(),
            damage: this.stats.damage,
            radius: 3
        });
        this.destroy();
    }

    takeDamage(amount) {
        this.stats.health -= amount;
        this.emit('damaged', this.stats.health);
        
        if (this.stats.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.emit('destroyed', this);
    }
}