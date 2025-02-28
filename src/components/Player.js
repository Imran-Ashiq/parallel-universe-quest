import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

export class Player extends EventEmitter {
    constructor(scene) {
        super();
        this.scene = scene;
        this.stats = {
            health: 100,
            maxHealth: 100,
            stamina: 100,
            maxStamina: 100,
            score: 0,
            staminaRegen: 15,
            dashCost: 30,
            invulnerableTime: 1,
            isInvulnerable: false
        };
        this.init();
    }

    init() {
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshPhongMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 0.5
            })
        );
        this.mesh.position.set(0, 0, 0);
        this.velocity = new THREE.Vector3();
        this.scene.add(this.mesh);
    }

    update(delta, keys) {
        // Stamina regeneration
        if (!this.isDashing && this.stats.stamina < this.stats.maxStamina) {
            this.stats.stamina = Math.min(
                this.stats.maxStamina,
                this.stats.stamina + this.stats.staminaRegen * delta
            );
            this.emit('staminaChanged', this.stats.stamina);
        }

        // Movement and dash handling
        const moveSpeed = this.isDashing ? 15 : 5;
        const moveVector = new THREE.Vector3();
        
        if (keys['w']) moveVector.z -= 1;
        if (keys['s']) moveVector.z += 1;
        if (keys['a']) moveVector.x -= 1;
        if (keys['d']) moveVector.x += 1;
        if (keys['Control']) moveVector.y -= 1;
        if (keys[' ']) moveVector.y += 1;

        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(moveSpeed * delta);
            this.mesh.position.add(moveVector);
        }

        // Health regeneration when collecting orbs
        if (this.stats.score > 0 && this.stats.score % 50 === 0) {
            this.heal(10);
        }

        // Handle dash
        if (keys['e'] && this.stats.stamina >= this.stats.dashCost && !this.stats.dashCooldown) {
            this.dash();
        }
    }

    dash() {
        this.stats.stamina -= this.stats.dashCost;
        this.isDashing = true;
        this.stats.dashCooldown = true;
        this.emit('staminaChanged', this.stats.stamina);

        setTimeout(() => {
            this.isDashing = false;
        }, 200);

        setTimeout(() => {
            this.stats.dashCooldown = false;
        }, 1000);
    }

    takeDamage(amount) {
        if (this.stats.isInvulnerable) return;
        
        this.stats.health = Math.max(0, this.stats.health - amount);
        this.stats.stamina = Math.max(0, this.stats.stamina - amount/2); // Damage affects stamina
        
        this.emit('healthChanged', this.stats.health);
        this.emit('staminaChanged', this.stats.stamina);
        
        // Visual feedback
        this.mesh.material.emissiveIntensity = 1;
        setTimeout(() => this.mesh.material.emissiveIntensity = 0.5, 200);
        
        // Invulnerability period
        this.stats.isInvulnerable = true;
        setTimeout(() => this.stats.isInvulnerable = false, this.stats.invulnerableTime * 1000);
        
        if (this.stats.health <= 0) {
            this.emit('died');
        }
    }

    addScore(points) {
        this.stats.score += points;
        this.emit('scoreChanged', this.stats.score);
    }

    getPosition() {
        return this.mesh.position;
    }

    heal(amount) {
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
        this.emit('healthChanged', this.stats.health);
    }
}