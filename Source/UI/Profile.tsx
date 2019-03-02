import { BaseComponent } from 'react-vextensions';
import { Column, Row, Pre, Button, TextInput, Div, CheckBox, Select, ColorPickerBox } from 'react-vcomponents';
import { GetUser, GetUserID } from 'Store/firebase/users';
import { User } from 'Store/firebase/users/@User';
import { UpdateProfile } from 'Server/Commands/UpdateProfile';
import { BoxController, ShowMessageBox } from 'react-vmessagebox';
import { presetBackgrounds } from 'Utils/UI/PresetBackgrounds';
import {Connect} from 'Utils/FrameworkOverrides';
import { styles } from '../Utils/UI/GlobalStyles';
import { ACTTopRightOpenPanelSet } from '../Store/main';

type Props = {} & Partial<{user: User}>;
@Connect((state, props: Props)=> ({
	user: GetUser(GetUserID()),
	}))
export class ProfileUI extends BaseComponent<Props, {}> {
	render() {
		const { user } = this.props;
		if (user == null) return <Column style={styles.page}>Must be signed-in to access.</Column>;

		return (
			<Column style={E(styles.page, { flex: '0 0 auto' })}>
				<Row>
					<Pre>Username: {user.displayName}</Pre>
					<Button ml={5} text="Change" onClick={() => {
						ShowChangeDisplayNameDialog(user._key, user.displayName);
					}}/>
				</Row>
				<Row mt={5}>Background:</Row>
				<Column mt={5} style={{ background: 'rgba(0,0,0,.7)' }}>
					<Row>
						{presetBackgrounds.Props().map((prop) => {
							const id = prop.name.ToInt();
							const background = prop.value;
							const selected = (user.backgroundID || 1) == id;
							return (
								<Div key={prop.index}
									style={E(
										{
											width: 100, height: 100, border: '1px solid black', cursor: 'pointer',
											backgroundColor: background.color, backgroundImage: `url(${background.url_1920})`,
											backgroundPosition: 'center', backgroundSize: 'cover',
										},
										selected && { border: '1px solid rgba(255,255,255,.3)' },
									)}
									onClick={() => {
										new UpdateProfile({ id: user._key, updates: { backgroundID: id } }).Run();
									}}>
								</Div>
							);
						})}
					</Row>
				</Column>
				<Row mt={5}>
					<CheckBox text="Custom background" checked={user.backgroundCustom_enabled} onChange={(val) => {
						new UpdateProfile({ id: user._key, updates: { backgroundCustom_enabled: val } }).Run();
					}}/>
				</Row>
				<Row mt={5}>
					<Pre>Color: </Pre>
					<ColorPickerBox color={user.backgroundCustom_color || '#FFFFFF'} onChange={(val) => {
						new UpdateProfile({ id: user._key, updates: { backgroundCustom_color: val } }).Run();
					}}/>
					<Button ml={5} text="Clear" onClick={() => {
						new UpdateProfile({ id: user._key, updates: { backgroundCustom_color: null } }).Run();
					}}/>
				</Row>
				<Row mt={5}>
					<Pre>URL: </Pre>
					<TextInput delayChangeTillDefocus={true} style={ES({ flex: 1 })}
						value={user.backgroundCustom_url} onChange={(val) => {
							new UpdateProfile({ id: user._key, updates: { backgroundCustom_url: val } }).Run();
						}}/>
				</Row>
				<Row mt={5}>
					<Pre>Anchor: </Pre>
					<Select options={[{ name: 'top', value: 'center top' }, { name: 'center', value: 'center center' }, { name: 'bottom', value: 'center bottom' }]}
						value={user.backgroundCustom_position || 'center center'} onChange={(val) => {
							new UpdateProfile({ id: user._key, updates: { backgroundCustom_position: val } }).Run();
						}}/>
				</Row>
				<Row mt={10} mb={5} style={{ fontSize: 15, fontWeight: 'bold' }}>Tools</Row>
				<Row>
					<Button text="Clear local data" onClick={() => {
						ShowMessageBox({ title: 'Clear local data?', cancelButton: true, message:
`Are you sure you want to clear local data?

Some of the things this will clear: (not exhaustive)
* The expansion-states of maps.
* Display settings.

Some of the things this won't clear:
* The content you've added to maps.
* Your posts and comments.

This is usually only done if an error is occuring because of outdated or invalid data.`,
						onOK: () => {
							const { ClearLocalData } = require('Utils/Store/CreateStore');
							ClearLocalData(persister);
							window.location.reload();
						},
						});
					}}/>
				</Row>
			</Column>
		);
	}
}

export function ShowChangeDisplayNameDialog(userID: string, oldDisplayName: string) {
	const firebase = store.firebase.helpers;

	let newDisplayName = oldDisplayName;

	const valid = true;
	const boxController: BoxController = ShowMessageBox({
		title: 'Change display name', cancelButton: true,
		message: () => {
			boxController.options.okButtonClickable = valid;
			return (
				<Column style={{ padding: '10px 0', width: 600 }}>
					<Row>
						<Pre>Display name: </Pre>
						<TextInput value={newDisplayName} onChange={(val) => {
							newDisplayName = val;
							boxController.UpdateUI();
						}}/>
					</Row>
				</Column>
			);
		},
		onOK: () => {
			new UpdateProfile({ id: userID, updates: { displayName: newDisplayName } }).Run();
		},
	});
}
