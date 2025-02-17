/*!
 * Copyright 2021 Cognite AS
 */

import { CadManager } from './CadManager';
import { CadModelFactory } from './CadModelFactory';

import { CadModelUpdateHandler, createV8SectorCuller } from '@reveal/cad-geometry-loaders';
import { CadMaterialManager, EffectRenderManager } from '@reveal/rendering';
import { InternalRevealCadOptions } from '@reveal/cad-model';
import { ModelDataProvider, ModelMetadataProvider } from '@reveal/modeldata-api';

export function createCadManager(
  modelMetadataProvider: ModelMetadataProvider,
  modelDataProvider: ModelDataProvider,
  renderer: THREE.WebGLRenderer,
  materialManager: CadMaterialManager,
  renderManager: EffectRenderManager,
  cadOptions: InternalRevealCadOptions & { continuousModelStreaming?: boolean }
): CadManager {
  const cadModelFactory = new CadModelFactory(materialManager, modelMetadataProvider, modelDataProvider);
  const sectorCuller =
    cadOptions && cadOptions.sectorCuller ? cadOptions.sectorCuller : createV8SectorCuller(renderer, renderManager);
  const cadModelUpdateHandler = new CadModelUpdateHandler(sectorCuller, cadOptions.continuousModelStreaming);
  return new CadManager(materialManager, cadModelFactory, cadModelUpdateHandler);
}
