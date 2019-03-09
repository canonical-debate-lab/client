import { CachedTransform, Clone, ToJSON, WaitXThenRun } from 'js-vextensions';
import { Button, Column, Div, Pre, Row, TextInput } from 'react-vcomponents';
import { BaseComponent, RenderSource } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { Connect } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { DeleteTermComponent } from '../../../Server/Commands/DeleteTermComponent';
import { UpdateTermComponentData } from '../../../Server/Commands/UpdateTermComponentData';
import { GetTermComponents } from '../../../Store/firebase/termComponents';
import { TermComponent } from '../../../Store/firebase/termComponents/@TermComponent';
import { Term } from '../../../Store/firebase/terms/@Term';
import { IsUserCreatorOrMod } from '../../../Store/firebase/userExtras';
import { MeID } from '../../../Store/firebase/users';
import { RootState } from '../../../Store/index';

const componentsPlaceholder = [];

type Props = {term: Term, editing: boolean, inMap?: boolean, style?} & Partial<{components: TermComponent[]}>;
@Connect((state: RootState, { term }: Props) => {
	const termComponents = GetTermComponents(term);
	return {
		// components: GetTermComponents(props.term),
		// only pass components when all are loaded
		components: CachedTransform('components_transform1', [term._id], termComponents, () => (termComponents.every(a => a != null) ? termComponents : componentsPlaceholder)),
		// selectedTermComponent: GetSelectedTermComponent(),
	};
})
export class TermComponentsUI extends BaseComponent<Props, {}> {
	render() {
		const { term, editing, inMap, style, components } = this.props;

		const creatorOrMod = IsUserCreatorOrMod(MeID(), term);

		return (
			<Column style={{ padding: 10 }}>
				{components.map((comp, index) => <TermComponentUI key={index} first={index == 0} termComponent={comp} editing={editing && creatorOrMod} inMap={inMap}/>)}
			</Column>
		);
	}
}

export class TermComponentUI extends BaseComponent
		<{termComponent: TermComponent, first: boolean, editing?: boolean, creating?: boolean, inMap?: boolean, onChange?: (updatedTermComponent: TermComponent)=>void},
		{updatedTermComponent: TermComponent}> {
	ComponentWillMountOrReceiveProps(props, forMount) {
		if (props.creating || props.editing) {
			if (forMount || this.state.updatedTermComponent == null || props.termComponent != this.props.termComponent) // if base-data changed
			{ this.SetState({ updatedTermComponent: Clone(props.termComponent) }); }
		}
	}

	render() {
		const { termComponent, first, editing, creating, inMap, onChange } = this.props;
		const { updatedTermComponent } = this.state;

		// let data = updatedTermComponent || termComponent;
		const changes = ToJSON(updatedTermComponent) != ToJSON(termComponent);

		const Change = (_) => {
			if (onChange) { onChange(this.GetUpdatedTermComponent()); }
			this.Update();
		};
		return (
			<Row mt={first ? 0 : 5}>
				{!creating && <Pre mr={7} sel style={E(inMap && { opacity: 0.5 })}>#{termComponent._id}</Pre>}
				{(creating || editing)
					? <TextInput ref={a => a && creating && this.lastRender_source == RenderSource.Mount && WaitXThenRun(0, () => a.DOM.focus())} style={ES({ flex: 1 })}
						value={updatedTermComponent.text} onChange={val => Change(updatedTermComponent.text = val)}/>
					: <Div sel>{termComponent.text}</Div>}
				{editing
					&& <Button ml={5} text="Save" enabled={changes} onClick={(e) => {
						new UpdateTermComponentData({ termComponentID: termComponent._id, updates: updatedTermComponent.Including('text') }).Run();
						// this.SetState({updatedTermComponent: null});
					}}/>}
				{editing
					&& <Button ml={5} text="Cancel" enabled={changes} onClick={(e) => {
						this.SetState({ updatedTermComponent: Clone(termComponent) });
					}}/>}
				{editing
					&& <Button ml={5} text="X" onClick={(e) => {
						ShowMessageBox({
							title: `Delete "${termComponent.text}"`, cancelButton: true,
							message: `Delete the term-component "${termComponent.text}"?`,
							onOK: async () => {
								new DeleteTermComponent({ termComponentID: termComponent._id }).Run();
							},
						});
					}}/>}
			</Row>
		);
	}
	GetUpdatedTermComponent() {
		const { updatedTermComponent } = this.state;
		return Clone(updatedTermComponent) as TermComponent;
	}
}