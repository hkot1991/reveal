/*!
 * Copyright 2021 Cognite AS
 */

import { MergingRTree, rtreeIntersection, rtreeUnion } from './MergingRTree';
import { Box3, Vector3 } from 'three';

describe('RTree', () => {
  function createRandomBoxes(n: number, maxDim: number, maxPos: number): Box3[] {
    const boxes: Box3[] = [];

    for (let i = 0; i < n; i++) {
      const sx = Math.random() * maxPos;
      const sy = Math.random() * maxPos;
      const sz = Math.random() * maxPos;

      const dx = Math.random() * maxDim;
      const dy = Math.random() * maxDim;
      const dz = Math.random() * maxDim;

      const box = new Box3(new Vector3(sx, sy, sz), new Vector3(sx + dx, sy + dy, sz + dz));
      boxes.push(box);
    }

    return boxes;
  }

  test('add bounding boxes and check that result contains them', () => {
    const rtree = new MergingRTree();

    const n = 1000;
    const d = 10; // Max size for each box, in each dimension
    const ms = 100; // Max min value for each box, in each dimension

    const boxes: Box3[] = createRandomBoxes(n, d, ms);

    for (const box of boxes) {
      rtree.insert(box);
    }

    const mergedBoxes = rtree.getBoxes();

    for (const box of boxes) {
      let isInMergedBoxes = false;
      for (const mergedBox of mergedBoxes) {
        if (mergedBox.containsBox(box)) {
          isInMergedBoxes = true;
          break;
        }
      }

      expect(isInMergedBoxes).toEqual(true);
    }
  });

  test('union of two trees contains all inserted boxes', () => {
    const rtree0 = new MergingRTree();
    const rtree1 = new MergingRTree();

    const n = 500;
    const d = 10;
    const ms = 100;

    const boxes0: Box3[] = createRandomBoxes(n, d, ms);
    const boxes1: Box3[] = createRandomBoxes(n, d, ms);

    for (const box of boxes0) {
      rtree0.insert(box);
    }

    for (const box of boxes1) {
      rtree1.insert(box);
    }

    const unionTree = rtreeUnion(rtree0, rtree1);

    const unionBoxes = unionTree.getBoxes();

    const allBoxes = boxes0.concat(boxes1);

    for (const box of allBoxes) {
      let isInUnion = false;
      for (const unionBox of unionBoxes) {
        if (unionBox.containsBox(box)) {
          isInUnion = true;
          break;
        }
      }

      expect(isInUnion).toEqual(true);
    }
  });

  test('intersection of two trees contains intersection between all boxes', () => {
    const rtree0 = new MergingRTree();
    const rtree1 = new MergingRTree();

    const n = 500;
    const d = 10;
    const ms = 100;

    const boxes0: Box3[] = createRandomBoxes(n, d, ms);
    const boxes1: Box3[] = createRandomBoxes(n, d, ms);

    for (const box of boxes0) {
      rtree0.insert(box);
    }

    for (const box of boxes1) {
      rtree1.insert(box);
    }

    const intersection = rtreeIntersection(rtree0, rtree1);

    const treeIntersectionBoxes = intersection.getBoxes();

    const allIntersectionBoxes: Box3[] = [];

    for (const box0 of boxes0) {
      for (const box1 of boxes1) {
        const boxIntersection = box0.clone().intersect(box1);
        if (!boxIntersection.isEmpty()) {
          allIntersectionBoxes.push(boxIntersection);
        }
      }
    }

    for (const box of allIntersectionBoxes) {
      let isInIntersection = false;
      for (const treeIntersectionBox of treeIntersectionBoxes) {
        if (treeIntersectionBox.containsBox(box)) {
          isInIntersection = true;
          break;
        }
      }

      expect(isInIntersection).toEqual(true);
    }
  });
});
