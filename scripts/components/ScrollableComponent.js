/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableComponent from '/scripts/components/InteractableComponent.js';
import LayoutComponent from '/scripts/components/LayoutComponent.js';
import PointerInteractable from '/scripts/interactables/PointerInteractable.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import * as THREE from 'three';

const VEC3 = new THREE.Vector3();
const PLANE = new THREE.Plane();
const SCROLL_THRESHOLD = 0.1;

class ScrollableComponent extends InteractableComponent {
    constructor(...styles) {
        super(...styles);
        this.scrollAmount = 0;
        this._scrollBoundsMin = new THREE.Vector2();
        this._scrollBoundsMax = new THREE.Vector2();
        this._scrollOwner;
    }

    updateLayout() {
        let oldHeight = this.computedHeight;
        let oldWidth = this.computedWidth;
        let height = this._computeDimension('height');
        let width = this._computeDimension('width');
        let contentHeight = this._getContentHeight();
        let contentWidth = this._getContentWidth();
        let overflowScroll = this.overflow == 'scroll';
        this._verticallyScrollable = contentHeight > height && overflowScroll;
        this._horizontallyScrollable = contentWidth > width && overflowScroll;
        this.scrollable = this._verticallyScrollable
            || this._horizontallyScrollable;
        let contentSize = this._content.children.reduce(
            (sum, child) => sum + (child instanceof LayoutComponent ? 1 : 0),0);
        let contentDirection = this.contentDirection;
        let alignItems = this.alignItems;
        let justifyContent = this.justifyContent;
        let p, dimension, dimensionName, otherDimension, sign, contentDimension,
            computedDimensionName, otherComputedDimensionName, vec2Param,
            otherVec2Param, scrollBounds1, scrollBounds2;
        let itemGap = 0;
        if(this.contentDirection == 'row') {
            dimension = -width;
            contentDimension = -contentWidth;
            otherDimension = height;
            computedDimensionName = 'computedWidth';
            otherComputedDimensionName = 'computedHeight';
            vec2Param = 'x';
            otherVec2Param = 'y';
            sign = 1;
            scrollBounds1 = this._scrollBoundsMin;
            scrollBounds2 = this._scrollBoundsMax;
        } else {
            dimension = height;
            contentDimension = contentHeight;
            otherDimension = -width;
            computedDimensionName = 'computedHeight';
            otherComputedDimensionName = 'computedWidth';
            vec2Param = 'y';
            otherVec2Param = 'x';
            sign = -1;
            scrollBounds1 = this._scrollBoundsMax;
            scrollBounds2 = this._scrollBoundsMin;
        }
        if(justifyContent == 'start') {
            p = dimension / 2;
            scrollBounds1[vec2Param] = contentDimension - dimension;
            scrollBounds2[vec2Param] = 0;
        } else if(justifyContent == 'end') {
            p = dimension / -2 + contentDimension;
            scrollBounds1[vec2Param] = 0;
            scrollBounds2[vec2Param] = -contentDimension + dimension;
        } else if(justifyContent == 'center') {
            p = contentDimension / 2;
            scrollBounds1[vec2Param] = (contentDimension - dimension) / 2;
            scrollBounds2[vec2Param] = scrollBounds1[vec2Param] * -1;
        } else if(Math.abs(dimension) - Math.abs(contentDimension) < 0) {
            //spaceBetween, spaceAround, and spaceEvenly act the same when
            //overflowed
            p = contentDimension / 2;
            scrollBounds1[vec2Param] = (contentDimension - dimension) / 2;
            scrollBounds2[vec2Param] = scrollBounds1[vec2Param] * -1;
        } else {
            scrollBounds1[vec2Param] = scrollBounds2[vec2Param] = 0;
            if(justifyContent == 'spaceBetween') {
                itemGap =  Math.abs(dimension - contentDimension)
                    / (contentSize - 1) * sign;
                p = dimension / 2;
            } else if(justifyContent == 'spaceAround') {
                itemGap = Math.abs(dimension - contentDimension)
                    / contentSize * sign;
                p = dimension / 2 + itemGap / 2;
            } else if(justifyContent == 'spaceEvenly') {
                itemGap = Math.abs(dimension - contentDimension)
                    / (contentSize + 1) * sign;
                p = dimension / 2 + itemGap;
            }
        }
        for(let child of this._content.children) {
            if(child instanceof LayoutComponent) {
                child.position[vec2Param] = p + child[computedDimensionName]
                    / 2 * sign;
                p += child[computedDimensionName] * sign;
                p += itemGap;
                if(alignItems == 'start') {
                    child.position[otherVec2Param] = otherDimension / 2
                        - child[otherComputedDimensionName] / 2 * sign;
                } else if(alignItems == 'end') {
                    child.position[otherVec2Param] = -otherDimension / 2
                        + child[otherComputedDimensionName] / 2 * sign;
                } else {
                    child.position[otherVec2Param] = 0;
                }
            }
        }
        this._createBackground();
        if(oldWidth != width || oldHeight != height) {
            if(this.clippingPlanes) this._updateClippingPlanes();
            if(this.parentComponent instanceof LayoutComponent)
                this.parent.parent.updateLayout();
            this._updateChildrensLayout(oldWidth != width, oldHeight != height);
        }
        this._updateInteractables();
    }

    _updateInteractables() {
        let active = this.scrollable || this._onClick != null
            || this._onDrag != null;
        let hasAction = this.pointerInteractable.hasAction(
            this._pointerInteractableAction);
        if(this.scrollable || this._onDrag
                || (this._onClick && this._getScrollableAncestor())) {
            this._pointerInteractableAction.dragAction = this._dragAction;
        } else {
            delete this._pointerInteractableAction.dragAction;
        }
        if(active == hasAction) return;
        if(active) {
            this.pointerInteractable.addAction(this._pointerInteractableAction);
        } else {
            this.pointerInteractable.removeAction(
                this._pointerInteractableAction);
        }
    }

    _onPointerClick(owner, closestPoint) {
        this.clearScroll(owner);
        if(this._scrollAncestor) {
            let clickEnabled = !this._scrollAncestor.scrollThresholdReached;
            this._scrollAncestor.clearScroll(owner);
            this._scrollAncestor = null;
            if(this._onClick && clickEnabled && closestPoint)
                this._onClick(owner,closestPoint);
        } else if(this._onClick) {
            this._onClick(owner, closestPoint);
        }
    }

    _onPointerDrag(owner, closestPoint) {
        if(this._onDrag) {
            this._onDrag(owner, closestPoint);
        } else if(this.scrollable){
            this.handleScroll(owner, closestPoint);
        } else if(this._scrollAncestor) {
            this._scrollAncestor.handleScroll(owner, closestPoint);
        } else {
            this._scrollAncestor = this._getScrollableAncestor();
            if(this._scrollAncestor) this._scrollAncestor.handleScroll(owner,
                closestPoint);
        }
    }

    clearScroll(owner) {
        if(this._scrollStart && owner == this._scrollOwner) {
            this._scrollOwner = null;
            this._scrollStart = this._scrollStartPosition = null;
            this.scrollThresholdReached = null;
            this.scrollAmount = 0;
        }
    }

    handleScroll(owner, closestPoint) {
        if(!this._scrollStart) {
            if(closestPoint) {
                this._scrollStart = this.worldToLocal(closestPoint.clone());
                this._scrollStartPosition = this._content.position.clone();
                this._scrollOwner = owner;
            }
        } else if(owner == this._scrollOwner) {
            if(!closestPoint) {
                PLANE.set(VEC3.set(0, 0, 1), 0);
                PLANE.applyMatrix4(this.matrixWorld);
                closestPoint = owner.raycaster.ray.intersectPlane(PLANE, VEC3);     
            } else {
                closestPoint = VEC3.copy(closestPoint);
            }
            if(closestPoint) {
                closestPoint = this.worldToLocal(closestPoint);
                if(this._horizontallyScrollable) this._scroll('x',closestPoint);    
                if(this._verticallyScrollable) this._scroll('y', closestPoint);
            }
        }
    }

    _getScrollableAncestor() {
        let object = this.parentComponent;
        while(object instanceof LayoutComponent) {
            if(object.scrollable) return object;
            object = object.parentComponent;
        }
    }

    _scroll(axis, closestPoint) {
        let currentPosition = this._content.position[axis];
        this._content.position[axis] = this._scrollStartPosition[axis]
            - this._scrollStart[axis] + closestPoint[axis];
        if(this._content.position[axis] < this._scrollBoundsMin[axis]) {
            this._content.position[axis] = this._scrollBoundsMin[axis];
        } else if(this._content.position[axis]>this._scrollBoundsMax[axis]){
            this._content.position[axis] = this._scrollBoundsMax[axis];
        }
        if(!this.scrollThresholdReached) {
            let diff = Math.abs(currentPosition - this._content.position[axis]);
            this.scrollAmount += diff;
            let computedParam = (axis == 'x')
                ? 'computedWidth'
                : 'computedHeight';
            if(this.scrollAmount > SCROLL_THRESHOLD * this[computedParam])
                this.scrollThresholdReached = true;
        }
    }
}

export default ScrollableComponent;
