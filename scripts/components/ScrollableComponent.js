/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import InteractableComponent from '/scripts/components/InteractableComponent.js';
import LayoutComponent from '/scripts/components/LayoutComponent.js';
import { capitalizeFirstLetter } from '/scripts/utils.js';
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
        this._scrollable = false;
        this._scrollableByAncestor = false;
        this._downAction = (e) => this.pointerInteractable.capture(e.owner);
        this._touchDownAction = (e) => this.touchInteractable.capture(e.owner);
    }

    updateLayout() {
        super.updateLayout();
        this._updateScrollInteractables();
    }

    _updateScrollInteractables() {
        let wasScrollable = this._scrollable || this._scrollableByAncestor;
        this._updateScrollable();
        if(wasScrollable == (this._scrollable || this._scrollableByAncestor))
            return;
        for(let child of this._content.children) {
            if(child instanceof ScrollableComponent)
                child._updateScrollInteractables();
        }
        let functionName = (wasScrollable)
            ? 'removeEventListener'
            : 'addEventListener';
        this.pointerInteractable[functionName]('down', this._downAction);
        this.touchInteractable[functionName]('down', this._touchDownAction);
        if(!this._onClick)
            this.pointerInteractable[functionName]('click', this._clickAction);
        if(!this._onDrag)
            this.pointerInteractable[functionName]('drag', this._dragAction);
        if(!this._onTouch)
            this.touchInteractable[functionName]('click', this._touchAction);
        if(!this._onTouchDrag)
            this.touchInteractable[functionName]('drag', this._touchDragAction);
    }

    _updateScrollable() {
        let height = this.computedHeight;
        let width = this.computedWidth;
        let contentHeight = this._getContentHeight();
        let contentWidth = this._getContentWidth();
        let overflowScroll = (this.overflow == 'scroll');
        this._verticallyScrollable = contentHeight > height && overflowScroll;
        this._horizontallyScrollable = contentWidth > width && overflowScroll;
        this._scrollable = this._verticallyScrollable
            || this._horizontallyScrollable;
        this._scrollableByAncestor = this._onClick != null
            && this._getScrollableAncestor() != null;
        if(!this._scrollable) {
            this._content.position.x = 0;
            this._content.position.y = 0;
            return;
        }
        let justifyContent = this.justifyContent;
        let alignItems = this.alignItems;
        let dimension, otherDimension, contentDimension, otherContentDimension,
            vec2Param, otherVec2Param, scrollBounds1, scrollBounds2;
        if(this.contentDirection == 'row') {
            dimension = -this.unpaddedWidth;
            otherDimension = this.unpaddedHeight;
            contentDimension = -contentWidth;
            otherContentDimension = contentHeight;
            vec2Param = 'x';
            otherVec2Param = 'y';
            scrollBounds1 = this._scrollBoundsMin;
            scrollBounds2 = this._scrollBoundsMax;
        } else {
            dimension = this.unpaddedHeight;
            otherDimension = -this.unpaddedWidth;
            contentDimension = contentHeight;
            otherContentDimension = -contentWidth;
            vec2Param = 'y';
            otherVec2Param = 'x';
            scrollBounds1 = this._scrollBoundsMax;
            scrollBounds2 = this._scrollBoundsMin;
        }
        if(justifyContent == 'start') {
            scrollBounds1[vec2Param] = contentDimension - dimension;
            scrollBounds2[vec2Param] = 0;
        } else if(justifyContent == 'end') {
            scrollBounds1[vec2Param] = 0;
            scrollBounds2[vec2Param] = -contentDimension + dimension;
        } else if(justifyContent == 'center') {
            scrollBounds1[vec2Param] = (contentDimension - dimension) / 2;
            scrollBounds2[vec2Param] = scrollBounds1[vec2Param] * -1;
        } else if(Math.abs(dimension) - Math.abs(contentDimension) < 0) {
            //spaceBetween, spaceAround, and spaceEvenly act the same when
            //overflowed
            scrollBounds1[vec2Param] = (contentDimension - dimension) / 2;
            scrollBounds2[vec2Param] = scrollBounds1[vec2Param] * -1;
        } else {
            scrollBounds1[vec2Param] = scrollBounds2[vec2Param] = 0;
        }
        if(alignItems == 'start') {
            scrollBounds2[otherVec2Param] = otherContentDimension
                - otherDimension;
            scrollBounds1[otherVec2Param] = 0;
        } else if(alignItems == 'end') {
            scrollBounds2[otherVec2Param] = 0;
            scrollBounds1[otherVec2Param] = -otherContentDimension
                + otherDimension;
        } else {
            scrollBounds2[otherVec2Param] = (otherContentDimension
                - otherDimension) / 2;
            scrollBounds1[otherVec2Param] = scrollBounds2[otherVec2Param] * -1;
        }
        if(this._verticallyScrollable) this._boundScrollPosition('y');
        if(this._horizontallyScrollable) this._boundScrollPosition('x');
    }

    _pointerClick(e) {
        let { owner, point } = e;
        if(this._scrollAncestor) {
            let clickEnabled = !this._scrollAncestor.scrollThresholdReached;
            this._scrollAncestor.clearScroll(owner);
            this._scrollAncestor = null;
            if(this._onClick && clickEnabled && point)
                this._onClick(e);
        } else if(this._onClick) {
            this._onClick(e);
        }
        this.clearScroll(owner);
    }

    _pointerDrag(e) {
        let { owner, point } = e;
        if(this._onDrag) {
            this._onDrag(e);
        } else if(this._scrollable) {
            this.handleScroll(owner, point);
        } else if(this._scrollableByAncestor) {
            if(this._scrollAncestor) {
                this._scrollAncestor.handleScroll(owner, point);
            } else {
                this._scrollAncestor = this._getScrollableAncestor();
                if(this._scrollAncestor)
                    this._scrollAncestor.handleScroll(owner, point);
            }
        }
    }

    _touch(e) {
        let owner = e.owner;
        if(this._scrollAncestor) {
            let touchEnabled = !this.scrollThresholdReached;
            this.scrollThresholdReached = false;
            this._scrollAncestor = null;
            if(this._onTouch && touchEnabled)
                this._onTouch(e);
        } else if(this._onTouch) {
            this._onTouch(e);
        }
        this.clearScroll(owner);
    }

    _touchDrag(e) {
        let owner = e.owner;
        if(this._onTouchDrag) {
            this._onTouchDrag(owner);
        } else if(this._scrollable) {
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

    handleScroll(owner, point) {
        if(!this._scrollStart) {
            if(point) {
                this._scrollStart = this.worldToLocal(point.clone());
                this._scrollStartPosition = this._content.position.clone();
                this._scrollOwner = owner;
                this._scrollType = 'POINTER';
            }
        } else if(owner == this._scrollOwner && this._scrollType == 'POINTER') {
            if(!point) {
                PLANE.set(VEC3.set(0, 0, 1), 0);
                PLANE.applyMatrix4(this.matrixWorld);
                point = owner.raycaster.ray.intersectPlane(PLANE, VEC3);
            } else {
                point = VEC3.copy(point);
            }
            if(point) {
                point = this.worldToLocal(point);
                if(this._horizontallyScrollable) this._scroll('x', point);
                if(this._verticallyScrollable) this._scroll('y', point);
            }
        }
    }

    handleTouchScroll(owner, interactable) {
        if(!this._scrollStart) {
            let details = interactable.getClosestPointTo(owner.object);
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
            if(object._scrollable) return object;
            object = object.parentComponent;
        }
    }

    _scroll(axis, point) {
        let currentPosition = this._content.position[axis];
        this._content.position[axis] = this._scrollStartPosition[axis]
            - this._scrollStart[axis] + point[axis];
        this._boundScrollPosition(axis);
        if(!this.scrollThresholdReached) {
            let diff = Math.abs(currentPosition - this._content.position[axis]);
            this.scrollAmount += diff;
            let computed = (axis == 'x')
                ? this.computedWidth
                : this.computedHeight;
            if(!this._scrollStartThresholdReached) {
                this._content.position[axis] = currentPosition;
                this._scrollStart[axis] = point[axis];
                if(this.scrollAmount >= SCROLL_START_THRESHOLD * computed) {
                    this._scrollStartThresholdReached = true;
                    this.scrollAmount = 0;
                }
            } else if(this.scrollAmount > SCROLL_THRESHOLD * computed) {
                this.scrollThresholdReached = true;
            }
        }
    }

    _boundScrollPosition(axis) {
        if(this._content.position[axis] < this._scrollBoundsMin[axis]) {
            this._content.position[axis] = this._scrollBoundsMin[axis];
        } else if(this._content.position[axis]>this._scrollBoundsMax[axis]) {
            this._content.position[axis] = this._scrollBoundsMax[axis];
        }
    }

    _setCallback(interactable, type, name, newCallback) {
        let callbackName = '_on' + capitalizeFirstLetter(name);
        let localCallbackName = '_' + name + 'Action';
        if(!this._scrollable && !this._scrollableByAncestor) {
            if(newCallback && !this[callbackName]) {
                interactable.addEventListener(type, this[localCallbackName]);
            } else if(!newCallback && this[callbackName]) {
                interactable.removeEventListener(type, this[localCallbackName]);
            }
        }
        this[callbackName] = newCallback;
    }
}

export default ScrollableComponent;
