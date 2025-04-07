class Particle {
    constructor() {
        this.x = Math.random() * 100;
        this.y = 120;
        this.size = Math.random() * 4 + 2;
        this.speed = Math.random() * 0.8 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.3;
        
        this.element = document.createElement('div');
        this.element.className = 'particle';
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.opacity = this.opacity;
        
        this.isInDOM = false;
    }
    
    update(speedMultiplier, movementFactor) {
        this.y -= this.speed * speedMultiplier * movementFactor;
        
        if (this.isInDOM) {
            this.element.style.top = `${this.y}%`;
            this.element.style.left = `${this.x}%`;
        }
        
        const stillVisible = this.y > -20;
        
        if (!stillVisible && this.isInDOM) {
            this.shouldRemove = true;
        }
        
        return stillVisible;
    }
    
    draw(container) {
        if (!this.isInDOM) {
            this.element.style.top = `${this.y}%`;
            this.element.style.left = `${this.x}%`;
            
            container.appendChild(this.element);
            this.isInDOM = true;
            this.shouldRemove = false;
        }
    }
    
    remove() {
        if (this.isInDOM && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.isInDOM = false;
        }
    }
}

class Obstacle {
    constructor(difficulty) {
        this.gapWidth = Math.max(35 - (difficulty * 1), 25);
        
        const maxPosition = 100 - this.gapWidth - 5;
        const minPosition = 5;
        this.gapPosition = minPosition + (Math.random() * (maxPosition - minPosition));
        
        this.y = 120;
        this.passed = false;
        this.height = 15 + Math.random() * 5;
        
        this.leftElement = document.createElement('div');
        this.leftElement.className = 'obstacle';
        
        this.rightElement = document.createElement('div');
        this.rightElement.className = 'obstacle';
        
        this.leftElement.style.left = '0';
        this.leftElement.style.width = `${this.gapPosition}%`;
        this.leftElement.style.height = `${this.height}px`;
        this.leftElement.style.transform = 'translateY(-50%)';
        
        this.rightElement.style.left = `${this.gapPosition + this.gapWidth}%`;
        this.rightElement.style.width = `${100 - (this.gapPosition + this.gapWidth)}%`;
        this.rightElement.style.height = `${this.height}px`;
        this.rightElement.style.transform = 'translateY(-50%)';
        
        this.isInDOM = false;
    }
    
    update(speedMultiplier, movementFactor) {
        this.y -= speedMultiplier * movementFactor;
        
        if (this.isInDOM) {
            this.leftElement.style.top = `${this.y}%`;
            this.rightElement.style.top = `${this.y}%`;
        }
        
        const stillVisible = this.y > -20;
        
        if (!stillVisible && this.isInDOM) {
            this.shouldRemove = true;
        }
        
        return stillVisible;
    }
    
    draw(container) {
        if (!this.isInDOM) {
            this.leftElement.style.top = `${this.y}%`;
            this.rightElement.style.top = `${this.y}%`;
            
            container.appendChild(this.leftElement);
            container.appendChild(this.rightElement);
            
            this.isInDOM = true;
            this.shouldRemove = false;
        }
    }
    
    remove() {
        if (this.isInDOM) {
            if (this.leftElement.parentNode) {
                this.leftElement.parentNode.removeChild(this.leftElement);
            }
            if (this.rightElement.parentNode) {
                this.rightElement.parentNode.removeChild(this.rightElement);
            }
            this.isInDOM = false;
        }
    }
    
    checkCollision(elevatorX, elevatorWidth, elevatorHeight, shaftWidth, shaftHeight) {
        const elevator = {
            centerX: (elevatorX / 100) * shaftWidth,
            centerY: (10 / 100) * shaftHeight,
            width: elevatorWidth,
            height: elevatorHeight
        };
        
        const elevatorLeft = elevator.centerX - (elevator.width / 2);
        const elevatorRight = elevator.centerX + (elevator.width / 2);
        const elevatorTop = elevator.centerY - (elevator.height / 2);
        const elevatorBottom = elevator.centerY + (elevator.height / 2);
        
        const obstacleY = (this.y / 100) * shaftHeight;
        const obstacleHeight = this.height;
        
        const obstacleTop = obstacleY - (obstacleHeight / 2);
        const obstacleBottom = obstacleY + (obstacleHeight / 2);
        
        const verticalOverlap = !(
            elevatorBottom < obstacleTop || 
            elevatorTop > obstacleBottom
        );
        
        if (!verticalOverlap) {
            if (obstacleBottom < elevatorTop && !this.passed) {
                this.passed = true;
            }
            return false;
        }
        
        const gapLeft = (this.gapPosition / 100) * shaftWidth;
        const gapRight = ((this.gapPosition + this.gapWidth) / 100) * shaftWidth;
        
        const insideGap = elevatorLeft >= gapLeft && elevatorRight <= gapRight;
        
        if (insideGap) {
            return false;
        }
        
        return true;
    }
}

// Export the classes for use in other modules
export { Particle, Obstacle }; 