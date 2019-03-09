import React from 'react';
import { DragLayer } from 'react-dnd';
import { BaseComponent, BaseComponentWithConnector } from 'react-vextensions';
import { MapNodeL2, MapNodeL3 } from 'Store/firebase/nodes/@MapNode';
import { GetNodeColor } from 'Store/firebase/nodes/@MapNodeType';
import { GetNodeDisplayText, IsPremiseOfSinglePremiseArgument } from 'Store/firebase/nodes/$node';
import { Row } from 'react-vcomponents';
import { GetParentNode, GetParentNodeL3 } from 'Store/firebase/nodes';
import { Connect } from 'Utils/FrameworkOverrides';

type DragLayerProps = {
	// intrinsic
	currentOffset: {x: number, y: number},
	// custom
	item?: any;
	itemType?: string;
	isDragging?: boolean;
	canDrop?: boolean;
};

@(DragLayer((monitor) => {
	return {
	item: monitor.getItem(),
	itemType: monitor.getItemType(),
	currentOffset: monitor.getSourceClientOffset(),
	isDragging: monitor.isDragging(),
// canDrop: monitor.canDrop(),
// canDrop: monitor.getItem() ? Log(monitor.getItem().piece.canDrop) !== false : null, // old; custom
/* canDrop: (()=> {
			const targetIds = monitor.isDragging() ? monitor.getTargetIds() : [];
			return targetIds.some(a=>monitor.isOverTarget(a) && monitor.canDropOnTarget(a));
			})(),
		}) */
	};
	}) as any)
export class VDragLayer extends BaseComponent<Partial<DragLayerProps>, {}> {
	render() {
		const { currentOffset, item, itemType, isDragging, canDrop } = this.props;
		if (!isDragging || currentOffset == null) return null;

		return (
			<div style={{ position: 'fixed', pointerEvents: 'none', zIndex: 100, left: 0, top: 0, width: '100%', height: '100%' }}>
				<div style={E(
					{
						transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
						WebkitTransform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
					},
					!currentOffset && { display: 'none' },
				)}>
					{itemType == 'node' &&
						<NodeUI_Preview node={item.node} path={item.path}/>}
				</div>
			</div>
		);
	}
}

const NodeUI_Preview_connector = (state, { node, path }: {node: MapNodeL3, path: string}) => {
	const parent = GetParentNodeL3(path);
	return {
		parent,
		combinedWithParentArgument: IsPremiseOfSinglePremiseArgument(node, parent),
	};
};
@Connect(NodeUI_Preview_connector)
class NodeUI_Preview extends BaseComponentWithConnector(NodeUI_Preview_connector, {}) {
	render() {
		const { node, parent, combinedWithParentArgument } = this.props;
		const backgroundColor = GetNodeColor(combinedWithParentArgument ? parent : node).desaturate(0.5).alpha(0.8);
		return (
			<Row className="cursorSet" style={E(
				{ width: '30%', padding: 5, backgroundColor: backgroundColor.css(), borderRadius: 5, border: '1px solid rgba(0,0,0,.5)' },
			)}>
				{GetNodeDisplayText(node, node._id.toString())}
			</Row>
		);
	}
}
