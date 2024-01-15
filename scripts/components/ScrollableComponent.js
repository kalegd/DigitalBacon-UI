/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableComponent from '/scripts/components/InteractableComponent.js';
import LayoutComponent from '/scripts/components/LayoutComponent.js';
import PointerInteractable from '/scripts/interactables/PointerInteractable.js';
import PointerInteractableHandler from '/scripts/handlers/PointerInteractableHandler.js';
import { numberOr } from '/scripts/utils.js';
import * as THREE from 'three';

const VEC3 = new THREE.Vector3();
const PLANE = new THREE.Plane();
const SCROLL_START_THRESHOLD = 0.02;
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
        let oldMarginedHeight = this.marginedHeight;
        let oldMarginedWidth = this.marginedWidth;
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
            computedDimensionName, otherComputedDimensionName, marginPriorName,
            marginAfterName, otherMarginPriorName, otherMarginAfterName,
            vec2Param, otherVec2Param, scrollBounds1, scrollBounds2;
        let itemGap = 0;
        if(this.contentDirection == 'row') {
            dimension = -this.unpaddedWidth;
            contentDimension = -contentWidth;
            otherDimension = this.unpaddedHeight;
            computedDimensionName = 'computedWidth';
            otherComputedDimensionName = 'computedHeight';
            marginPriorName = 'marginLeft';
            marginAfterName = 'marginRight';
            otherMarginPriorName = 'marginTop';
            otherMarginAfterName = 'marginBottom';
            vec2Param = 'x';
            otherVec2Param = 'y';
            sign = 1;
            scrollBounds1 = this._scrollBoundsMin;
            scrollBounds2 = this._scrollBoundsMax;
        } else {
            dimension = this.unpaddedHeight;
            contentDimension = contentHeight;
            otherDimension = -this.unpaddedWidth;
            computedDimensionName = 'computedHeight';
            otherComputedDimensionName = 'computedWidth';
            marginPriorName = 'marginTop';
            marginAfterName = 'marginBottom';
            otherMarginPriorName = 'marginLeft';
            otherMarginAfterName = 'marginRight';
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
                let margin = child.margin || 0;
                let marginPrior = numberOr(child[marginPriorName], margin);
                let marginAfter = numberOr(child[marginAfterName], margin);
                let otherMarginPrior = numberOr(child[otherMarginPriorName],
                    margin);
                let otherMarginAfter = numberOr(child[otherMarginAfterName],
                    margin);
                p += marginPrior * sign;
                child.position[vec2Param] = p + child[computedDimensionName]
                    / 2 * sign;
                p += child[computedDimensionName] * sign;
                p += marginAfter * sign;
                p += itemGap;
                if(alignItems == 'start') {
                    child.position[otherVec2Param] = otherDimension / 2
                        - child[otherComputedDimensionName] / 2 * sign
                        - otherMarginPrior * sign;
                } else if(alignItems == 'end') {
                    child.position[otherVec2Param] = -otherDimension / 2
                        + child[otherComputedDimensionName] / 2 * sign
                        + otherMarginAfter * sign;
                } else {
                    child.position[otherVec2Param] = 0;
                }
            }
        }
        if(oldWidth != width || oldHeight != height) {
            this._createBackground();
            if(this.clippingPlanes) this._updateClippingPlanes();
            if(this.parentComponent instanceof LayoutComponent)
                this.parent.parent.updateLayout();
            this._updateChildrensLayout(oldWidth != width, oldHeight != height);
        } else if(oldMarginedHeight != this.marginedHeight
                || oldMarginedWidth != this.marginedWidth) {
            if(this.clippingPlanes) this._updateClippingPlanes();
            if(this.parentComponent instanceof LayoutComponent)
                this.parent.parent.updateLayout();
        }
        this._updateInteractables();
    }

    _updateInteractables() {
        let clickActive = this.scrollable || this._onClick != null
            || this._onDrag != null;
        let touchActive = this.scrollable || this._onTouch != null
            || this._onTouchDrag != null;
        let hasClickAction = this.pointerInteractable.hasAction(
            this._pointerInteractableAction);
        let hasTouchAction = this.touchInteractable.hasAction(
            this._touchInteractableAction);
        let scrollableAncestor = this._getScrollableAncestor();
        if(this.scrollable || this._onDrag
                || (this._onClick && scrollableAncestor)) {
            this._pointerInteractableAction.dragAction = this._dragAction;
        } else {
            delete this._pointerInteractableAction.dragAction;
        }
        if(this.scrollable || this._onTouchDrag
                || (this._onTouch && scrollableAncestor)) {
            this._touchInteractableAction.dragAction = this._touchDragAction;
        } else {
            delete this._touchInteractableAction.dragAction;
        }
        if(clickActive != hasClickAction) {
            if(clickActive) {
                this.pointerInteractable.addAction(
                    this._pointerInteractableAction);
            } else {
                this.pointerInteractable.removeAction(
                    this._pointerInteractableAction);
            }
        }
        if(touchActive != hasTouchAction) {
            if(touchActive) {
                this.touchInteractable.addAction(this._touchInteractableAction);
            } else {
                this.touchInteractable.removeAction(
                    this._touchInteractableAction);
            }
        }
    }

    _pointerClick(owner, closestPoint) {
        if(this._scrollAncestor) {
            let clickEnabled = !this._scrollAncestor.scrollThresholdReached;
            this._scrollAncestor.clearScroll(owner);
            this._scrollAncestor = null;
            if(this._onClick && clickEnabled && closestPoint)
                this._onClick(owner,closestPoint);
        } else if(this._onClick) {
            this._onClick(owner, closestPoint);
        }
        this.clearScroll(owner);
    }

    _pointerDrag(owner, closestPoint) {
        if(this._onDrag) {
            this._onDrag(owner, closestPoint);
        } else if(this.scrollable) {
            this.handleScroll(owner, closestPoint);
        } else if(this._scrollAncestor) {
            this._scrollAncestor.handleScroll(owner, closestPoint);
        } else {
            this._scrollAncestor = this._getScrollableAncestor();
            if(this._scrollAncestor) this._scrollAncestor.handleScroll(owner,
                closestPoint);
        }
    }

    _touch(owner) {
        if(this._scrollAncestor) {
            let touchEnabled = !this.scrollThresholdReached;
            this.scrollThresholdReached = false;
            this._scrollAncestor = null;
            if(this._onTouch && touchEnabled)
                this._onTouch(owner);
        } else if(this._onTouch) {
            this._onTouch(owner);
        }
        this.clearScroll(owner);
    }

    _touchDrag(owner) {
        if(this._onTouchDrag) {
            this._onTouchDrag(owner);
        } else if(this.scrollable) {
            this.handleTouchScroll(owner, this.touchInteractable);
        } else if(this._scrollAncestor) {
            if(this._scrollAncestor.scrollThresholdReached
                    && !this.scrollThresholdReached)
                this.scrollThresholdReached = true;
        } else {
            this._scrollAncestor = this._getScrollableAncestor();
        }

    }

    clearScroll(owner) {
        if(this._scrollStart && owner == this._scrollOwner) {
            this._scrollOwner = null;
            this._scrollStart = null;
            this._scrollStartPosition = null;
            this._scrollType = null;
            this._scrollStartThresholdReached = null;
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
                this._scrollType = 'POINTER';
            }
        } else if(owner == this._scrollOwner && this._scrollType == 'POINTER') {
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

    handleTouchScroll(owner, interactable) {
        if(!this._scrollStart) {
            let details = interactable.getIntersectionPoints(owner);
            this._scrollController = details[1].object;
            this._scrollVertex = this._scrollController.bvhGeometry.index.array[
                details[1].faceIndex * 3];
            let positionAttribute = this._scrollController.bvhGeometry
                .getAttribute('position');
            VEC3.fromBufferAttribute(positionAttribute, this._scrollVertex);
            this._scrollController.localToWorld(VEC3);
            this._scrollStart = this.worldToLocal(VEC3).clone();
            this._scrollStartPosition = this._content.position.clone();
            this._scrollOwner = owner;
            this._scrollType = 'TOUCH';
        } else if(owner == this._scrollOwner && this._scrollType == 'TOUCH') {
            let positionAttribute = this._scrollController.bvhGeometry
                .getAttribute('position');
            VEC3.fromBufferAttribute(positionAttribute, this._scrollVertex);
            this._scrollController.localToWorld(VEC3);
            this.worldToLocal(VEC3);
            if(this._horizontallyScrollable) this._scroll('x', VEC3); 
            if(this._verticallyScrollable) this._scroll('y', VEC3);
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
            let computed = (axis == 'x')
                ? this.computedWidth
                : this.computedHeight;
            if(!this._scrollStartThresholdReached) {
                this._content.position[axis] = currentPosition;
                this._scrollStart[axis] = closestPoint[axis];
                if(this.scrollAmount >= SCROLL_START_THRESHOLD * computed) {
                    this._scrollStartThresholdReached = true;
                    this.scrollAmount = 0;
                }
            } else if(this.scrollAmount > SCROLL_THRESHOLD * computed) {
                this.scrollThresholdReached = true;
            }
        }
    }
}

export default ScrollableComponent;
