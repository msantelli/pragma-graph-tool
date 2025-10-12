import React from 'react';
import { Modal } from '../Modal';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setSelectedNodeForCustomization } from '../../store/uiSlice';
import {
  updateNode,
  deleteNode as removeNode,
  saveToHistory,
  setNodeParent,
  toggleContainer,
  setContainerPadding,
  setManualContainerSize,
  fitContainerToChildren
} from '../../store/diagramSlice';
import { getNodeColors, getNodeShape } from '../../utils/nodeUtils';
import { getDescendants, calculateContainerBounds } from '../../utils/containmentUtils';
import type { NodeStyle } from '../../types/all';

interface NodeCustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NodeCustomizationPanel: React.FC<NodeCustomizationPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const selectedNodeForCustomization = useAppSelector(state => state.ui.selectedNodeForCustomization);
  const currentDiagram = useAppSelector(state => state.diagram.currentDiagram);
  const advancedMode = useAppSelector(state => state.ui.advancedMode);

  const node = currentDiagram?.nodes.find(n => n.id === selectedNodeForCustomization);
  const nodes = React.useMemo(
    () => currentDiagram?.nodes ?? [],
    [currentDiagram?.nodes]
  );

  const [paddingInput, setPaddingInput] = React.useState<string>('20');
  const [manualWidthInput, setManualWidthInput] = React.useState<string>('');
  const [manualHeightInput, setManualHeightInput] = React.useState<string>('');

  React.useEffect(() => {
    if (!node) {
      setPaddingInput('20');
      setManualWidthInput('');
      setManualHeightInput('');
      return;
    }

    setPaddingInput(node.containerPadding !== undefined ? String(node.containerPadding) : '20');
    if (node.manualSize) {
      setManualWidthInput(String(Math.round(node.manualSize.width)));
      setManualHeightInput(String(Math.round(node.manualSize.height)));
    } else {
      setManualWidthInput('');
      setManualHeightInput('');
    }
  }, [node]);

  const parentOptions = React.useMemo(() => {
    if (!node) return [];

    const invalidIds = new Set<string>(getDescendants(nodes, node.id));
    invalidIds.add(node.id);

    return nodes
      .filter(n => !invalidIds.has(n.id))
      .map(n => ({
        id: n.id,
        label: n.label || `${n.type} (${n.id.slice(0, 6)})`
      }));
  }, [nodes, node]);

  const updateNodeStyle = (styleUpdate: Partial<NodeStyle>) => {
    if (!node) return;

    dispatch(saveToHistory());
    dispatch(updateNode({
      id: node.id,
      updates: {
        style: { ...node.style, ...styleUpdate }
      }
    }));
  };

  const updateNodeLabel = (label: string) => {
    if (!node) return;

    dispatch(saveToHistory());
    dispatch(updateNode({
      id: node.id,
      updates: { label }
    }));
  };

  const resetNodeStyle = () => {
    if (!node) return;

    dispatch(saveToHistory());
    dispatch(updateNode({
      id: node.id,
      updates: {
        style: undefined
      }
    }));
  };

  const deleteNode = () => {
    if (!node) return;

    dispatch(saveToHistory());
    dispatch(removeNode(node.id));
    dispatch(setSelectedNodeForCustomization(null));
    onClose();
  };

  const handleClose = () => {
    dispatch(setSelectedNodeForCustomization(null));
    onClose();
  };

  const handleToggleContainer = () => {
    if (!node) return;
    dispatch(saveToHistory());
    dispatch(toggleContainer(node.id));
  };

  const handleParentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!node) return;
    const newParentId = event.target.value || null;
    const currentParentId = node.parentId ?? null;
    if (newParentId === currentParentId) return;

    dispatch(saveToHistory());
    dispatch(setNodeParent({
      nodeId: node.id,
      parentId: newParentId
    }));
  };

  const handlePaddingBlur = () => {
    if (!node || !node.isContainer) return;

    const parsed = Number(paddingInput);
    if (!Number.isFinite(parsed)) {
      setPaddingInput(String(node.containerPadding ?? 20));
      return;
    }

    const normalized = Math.max(0, Math.round(parsed));
    if (normalized === (node.containerPadding ?? 20)) {
      setPaddingInput(String(normalized));
      return;
    }

    dispatch(saveToHistory());
    dispatch(setContainerPadding({
      nodeId: node.id,
      padding: normalized
    }));
    setPaddingInput(String(normalized));
  };

  const handleManualModeChange = (checked: boolean) => {
    if (!node || !node.isContainer) return;

    dispatch(saveToHistory());
    if (checked) {
      const bounds = calculateContainerBounds(nodes, node.id);
      const width = Math.max(50, Math.round(bounds.width));
      const height = Math.max(50, Math.round(bounds.height));
      setManualWidthInput(String(width));
      setManualHeightInput(String(height));
      dispatch(setManualContainerSize({
        nodeId: node.id,
        width,
        height
      }));
    } else {
      dispatch(fitContainerToChildren(node.id));
      setManualWidthInput('');
      setManualHeightInput('');
    }
  };

  const handleManualWidthBlur = () => {
    if (!node || !node.isContainer || !node.manualSize) return;

    const parsed = Number(manualWidthInput);
    if (!Number.isFinite(parsed)) {
      setManualWidthInput(String(Math.round(node.manualSize.width)));
      return;
    }

    const normalized = Math.max(50, Math.round(parsed));
    if (normalized === Math.round(node.manualSize.width)) {
      setManualWidthInput(String(normalized));
      return;
    }

    dispatch(saveToHistory());
    dispatch(setManualContainerSize({
      nodeId: node.id,
      width: normalized,
      height: node.manualSize.height
    }));
    setManualWidthInput(String(normalized));
  };

  const handleManualHeightBlur = () => {
    if (!node || !node.isContainer || !node.manualSize) return;

    const parsed = Number(manualHeightInput);
    if (!Number.isFinite(parsed)) {
      setManualHeightInput(String(Math.round(node.manualSize.height)));
      return;
    }

    const normalized = Math.max(50, Math.round(parsed));
    if (normalized === Math.round(node.manualSize.height)) {
      setManualHeightInput(String(normalized));
      return;
    }

    dispatch(saveToHistory());
    dispatch(setManualContainerSize({
      nodeId: node.id,
      width: node.manualSize.width,
      height: normalized
    }));
    setManualHeightInput(String(normalized));
  };

  if (!node) return null;

  const currentStyle = node.style || { size: 'medium' };

  const sizeFontMap = {
    small: 12,
    medium: 14,
    large: 18
  } as const;

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    updateNodeStyle({ size, fontSize: sizeFontMap[size] });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Customize ${node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node`}
      maxWidth="480px"
    >
      {/* Label/Caption Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Caption:
        </label>
        <input
          type="text"
          value={node.label}
          onChange={(e) => updateNodeLabel(e.target.value)}
          placeholder="Enter node caption..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Size Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Size:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['small', 'medium', 'large'] as const).map(size => (
            <button
              key={size}
              onClick={() => handleSizeChange(size)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: `2px solid ${currentStyle.size === size ? '#4CAF50' : '#ddd'}`,
                background: currentStyle.size === size ? '#d7eed7' : '#f1f1f1',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: currentStyle.size === size ? 'bold' : 'normal',
                color: currentStyle.size === size ? '#1B5E20' : '#333'
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Shape Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Shape:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '8px' }}>
          {(['circle', 'ellipse', 'rectangle', 'diamond', 'triangle', 'hexagon', 'star'] as const).map(shape => {
            const currentShape = getNodeShape(node);
            const isSelected = currentShape === shape;
            return (
              <button
                key={shape}
                onClick={() => updateNodeStyle({ shape })}
                style={{
                  padding: '12px 8px',
                  border: `2px solid ${isSelected ? '#4CAF50' : '#ddd'}`,
                  background: isSelected ? '#E8F5E8' : '#f9f9f9',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#333',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => (e.target as HTMLButtonElement).style.outline = '2px solid #4CAF50'}
                onBlur={(e) => (e.target as HTMLButtonElement).style.outline = 'none'}
              >
                <div style={{ fontSize: '16px' }}>
                  {shape === 'circle' && '●'}
                  {shape === 'ellipse' && '⬭'}
                  {shape === 'rectangle' && '▭'}
                  {shape === 'diamond' && '◇'}
                  {shape === 'triangle' && '▲'}
                  {shape === 'hexagon' && '⬢'}
                  {shape === 'star' && '★'}
                </div>
                <span style={{ textTransform: 'capitalize', fontSize: '12px' }}>
                  {shape}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Background Color */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Background Color:
        </label>
        <input
          type="color"
          value={getNodeColors(node).background}
          onChange={(e) => updateNodeStyle({ backgroundColor: e.target.value })}
          style={{
            width: '100%',
            height: '40px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Border Color */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Border Color:
        </label>
        <input
          type="color"
          value={getNodeColors(node).border}
          onChange={(e) => updateNodeStyle({ borderColor: e.target.value })}
          style={{
            width: '100%',
            height: '40px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Text Color */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Text Color:
        </label>
        <input
          type="color"
          value={node.style?.textColor || '#000000'}
          onChange={(e) => updateNodeStyle({ textColor: e.target.value })}
          style={{
            width: '100%',
            height: '40px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
      </div>

      {advancedMode && (
        <>
          <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2c3e50' }}>
              Advanced Settings
            </h3>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                marginBottom: '16px',
                background: '#f9f9f9'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>Container Mode</div>
                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                  Allow this node to frame and manage child nodes.
                </div>
              </div>
              <input
                type="checkbox"
                checked={node.isContainer ?? false}
                onChange={handleToggleContainer}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>
                Parent Container
              </label>
              <select
                value={node.parentId ?? ''}
                onChange={handleParentChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">No parent (top level)</option>
                {parentOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                Assign this node to an existing container. Only non-descendant nodes appear here.
              </div>
            </div>

            {node.isContainer && (
              <div
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  padding: '12px',
                  background: '#fcfcfc'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                  Container Layout
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>
                    Padding (px)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={paddingInput}
                    onChange={(e) => setPaddingInput(e.target.value)}
                    onBlur={handlePaddingBlur}
                    style={{
                      width: '120px',
                      padding: '6px 10px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: node.manualSize ? '12px' : '0'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>Manual Size</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Override auto-fit width & height for this container.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(node.manualSize)}
                    onChange={(e) => handleManualModeChange(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                {node.manualSize && (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min="50"
                        value={manualWidthInput}
                        onChange={(e) => setManualWidthInput(e.target.value)}
                        onBlur={handleManualWidthBlur}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min="50"
                        value={manualHeightInput}
                        onChange={(e) => setManualHeightInput(e.target.value)}
                        onBlur={handleManualHeightBlur}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={resetNodeStyle}
          style={{
            flex: '1',
            minWidth: '120px',
            padding: '10px 16px',
            border: '2px solid #FF9800',
            background: '#FFF3E0',
            color: '#FF9800',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          Reset Style
        </button>
        <button
          onClick={deleteNode}
          style={{
            flex: '1',
            minWidth: '120px',
            padding: '10px 16px',
            border: '2px solid #f44336',
            background: '#ffebee',
            color: '#f44336',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          🗑️ Delete
        </button>
        <button
          onClick={handleClose}
          style={{
            flex: '1',
            minWidth: '120px',
            padding: '10px 16px',
            border: '2px solid #4CAF50',
            background: '#4CAF50',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          Done
        </button>
      </div>
    </Modal>
  );
};
