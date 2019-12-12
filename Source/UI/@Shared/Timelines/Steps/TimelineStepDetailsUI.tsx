import { GetErrorMessagesUnderElement, Clone } from 'js-vextensions';
import { Button, Column, Pre, Row, RowLR, Spinner, TextInput, TextArea } from 'react-vcomponents';
import { BaseComponent, GetDOM } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { GetUpdates } from 'vwebapp-framework';
import { UpdateTimelineStep } from '../../../../Server/Commands/UpdateTimelineStep';
import { NodeReveal, TimelineStep } from '../../../../Store/firebase/timelineSteps/@TimelineStep';

type Props = {baseData: TimelineStep, forNew: boolean, enabled?: boolean, style?, onChange?: (newData: TimelineStep, ui: TimelineStepDetailsUI)=>void};
export class TimelineStepDetailsUI extends BaseComponent<Props, {newData: TimelineStep}> {
	static defaultProps = { enabled: true };
	ComponentWillMountOrReceiveProps(props, forMount) {
		if (forMount || props.baseData != this.props.baseData) { // if base-data changed
			this.SetState({ newData: Clone(props.baseData) });
		}
	}

	render() {
		const { forNew, enabled, style, onChange } = this.props;
		const { newData } = this.state;
		const Change = (..._) => {
			if (onChange) onChange(this.GetNewData(), this);
			this.Update();
		};

		const splitAt = 170; const width = 600;
		return (
			<Column style={style}>
				<RowLR mt={5} splitAt={splitAt} style={{ width }}>
					<Pre>Title: </Pre>
					<TextInput value={newData.title} onChange={(val) => Change(newData.title = val)}/>
				</RowLR>
				<Column mt={5} style={{ width }}>
					<Pre>Message:</Pre>
					<TextArea autoSize={true} value={newData.message} onChange={(val) => Change(newData.message = val)}/>
				</Column>
				<Row mt={5}>
					<Pre>Nodes to show:</Pre>
					<Button text="Add" ml="auto" onClick={() => {
						newData.nodeReveals = (newData.nodeReveals || []).concat(new NodeReveal());
						Change();
					}}/>
				</Row>
				{newData.nodeReveals && newData.nodeReveals.map((reveal, index) => {
					return <NodeRevealUI step={newData} reveal={reveal} Change={Change}/>;
				})}
			</Column>
		);
	}
	GetValidationError() {
		return GetErrorMessagesUnderElement(GetDOM(this))[0];
	}

	GetNewData() {
		const { newData } = this.state;
		return Clone(newData) as TimelineStep;
	}
}

class NodeRevealUI extends BaseComponent<{step: TimelineStep, reveal: NodeReveal, Change: Function}, {}> {
	render() {
		const { step, reveal, Change } = this.props;
		return (
			<Row>
				<Pre>Path: </Pre>
				<TextInput value={reveal.path} onChange={(val) => Change(reveal.path = val)}/>
				<Pre ml={5}>Reveal depth: </Pre>
				<Spinner min={0} max={10} value={reveal.revealDepth} onChange={(val) => Change(reveal.revealDepth = val)}/>
				<Button ml={5} text="X" onClick={() => {
					step.nodeReveals.Remove(reveal);
					Change();
				}}/>
			</Row>
		);
	}
}

export function ShowEditTimelineStepDialog(userID: string, step: TimelineStep) {
	let newStep = Clone(step);

	let error = null;
	const Change = (..._) => boxController.UpdateUI();
	let boxController = ShowMessageBox({
		title: 'Edit step', cancelButton: true,
		message: () => {
			boxController.options.okButtonClickable = error == null;
			return (
				<Column style={{ padding: '10px 0', width: 600 }}>
					<TimelineStepDetailsUI baseData={newStep} forNew={true} onChange={(val, ui) => Change(newStep = val, error = ui.GetValidationError())}/>
					{error && error != 'Please fill out this field.' && <Row mt={5} style={{ color: 'rgba(200,70,70,1)' }}>{error}</Row>}
				</Column>
			);
		},
		onOK: () => {
			const stepUpdates = GetUpdates(step, newStep);
			new UpdateTimelineStep({ stepID: step._key, stepUpdates }).Run();
		},
	});
}
