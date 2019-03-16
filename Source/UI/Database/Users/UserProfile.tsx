import { BaseComponent, BaseComponentWithConnector } from 'react-vextensions';
import { Column, Row, Pre, Button, TextInput, Div, CheckBox, Select, ColorPickerBox } from 'react-vcomponents';
import { GetUser, MeID, GetUserPermissionGroups } from 'Store/firebase/users';
import { User } from 'Store/firebase/users/@User';
import { UpdateProfile } from 'Server/Commands/UpdateProfile';
import { BoxController, ShowMessageBox } from 'react-vmessagebox';
import { presetBackgrounds, defaultPresetBackground } from 'Utils/UI/PresetBackgrounds';
import { Connect, ClearLocalData, DBPath } from 'Utils/FrameworkOverrides';
import { styles, ES } from 'Utils/UI/GlobalStyles';
import { Fragment } from 'react';
import { PropNameToTitle } from 'Utils/General/Others';
import { SetUserPermissionGroups } from 'Server/Commands/SetUserPermissionGroups';

const connector = (state, { profileUser }: {profileUser: User}) => ({
	profileUserPermissionGroups: GetUserPermissionGroups(profileUser ? profileUser._key : null),
	currentUser: GetUser(MeID()),
});
@Connect(connector)
export class UserProfileUI extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { profileUser, profileUserPermissionGroups, currentUser } = this.props;
		if (profileUser == null) return <Column style={styles.page}>User does not exist.</Column>;
		// if (currentUser == null) return <Column style={styles.page}>Must be signed-in to access.</Column>;

		return (
			<Column style={E(styles.page, { flex: '0 0 auto' })}>
				<Row>
					<Pre>Username: {profileUser.displayName}</Pre>
					{profileUser == currentUser &&
						<Button ml={5} text="Change" onClick={() => {
							ShowChangeDisplayNameDialog(currentUser._key, currentUser.displayName);
						}}/>}
				</Row>
				<Row mt={3}>
					<Pre>Permissions: </Pre>
					{['basic', 'verified', 'mod', 'admin'].map((group, index) => {
						const admin = MeID() && GetUserPermissionGroups(MeID()).admin;
						const changingOwnAdminState = currentUser && profileUser._key == currentUser._key && group == 'admin';
						return (
							<CheckBox key={index} mr={index < 3 ? 5 : 0} text={PropNameToTitle(group)} checked={(profileUserPermissionGroups || {})[group]} enabled={admin && !changingOwnAdminState} onChange={(val) => {
								const newPermissionGroups = E(profileUserPermissionGroups, { [group]: val });
								new SetUserPermissionGroups({ userID: profileUser._key, permissionGroups: newPermissionGroups }).Run();
							}}/>
						);
					})}
				</Row>

				{profileUser == currentUser &&
					<Fragment>
						<Row mt={10} mb={5} style={{ fontSize: 15, fontWeight: 'bold' }}>Customization</Row>
						<Row mt={5}>Background:</Row>
						<Column mt={5} style={{ background: 'rgba(0,0,0,.7)' }}>
							<Row style={{ flexWrap: 'wrap' }}>
								{presetBackgrounds.Pairs().map((prop) => {
									const id = prop.key;
									const background = prop.value;
									const selected = (profileUser.backgroundID || defaultPresetBackground) == id;
									return (
										<Div key={prop.index}
											style={E(
												{
													width: 100, height: 100, border: '1px solid black', cursor: 'pointer',
													backgroundColor: background.color, backgroundImage: `url(${background.url_1920 || background.url_3840 || background.url_max})`,
													backgroundPosition: 'center', backgroundSize: 'cover',
												},
												selected && { border: '1px solid rgba(255,255,255,.3)' },
											)}
											onClick={() => {
												new UpdateProfile({ id: profileUser._key, updates: { backgroundID: id } }).Run();
											}}>
										</Div>
									);
								})}
							</Row>
						</Column>
						<Row mt={5}>
							<CheckBox text="Custom background" checked={profileUser.backgroundCustom_enabled} onChange={(val) => {
								new UpdateProfile({ id: profileUser._key, updates: { backgroundCustom_enabled: val } }).Run();
							}}/>
						</Row>
						<Row mt={5}>
							<Pre>Color: </Pre>
							<ColorPickerBox color={profileUser.backgroundCustom_color || '#FFFFFF'} onChange={(val) => {
								new UpdateProfile({ id: profileUser._key, updates: { backgroundCustom_color: val } }).Run();
							}}/>
							<Button ml={5} text="Clear" onClick={() => {
								new UpdateProfile({ id: profileUser._key, updates: { backgroundCustom_color: null } }).Run();
							}}/>
						</Row>
						<Row mt={5}>
							<Pre>URL: </Pre>
							<TextInput delayChangeTillDefocus={true} style={ES({ flex: 1 })}
								value={profileUser.backgroundCustom_url} onChange={(val) => {
									new UpdateProfile({ id: profileUser._key, updates: { backgroundCustom_url: val } }).Run();
								}}/>
						</Row>
						<Row mt={5}>
							<Pre>Anchor: </Pre>
							<Select options={[{ name: 'top', value: 'center top' }, { name: 'center', value: 'center center' }, { name: 'bottom', value: 'center bottom' }]}
								value={profileUser.backgroundCustom_position || 'center center'} onChange={(val) => {
									new UpdateProfile({ id: profileUser._key, updates: { backgroundCustom_position: val } }).Run();
								}}/>
						</Row>
					</Fragment>}

				{profileUser == currentUser &&
					<Fragment>
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
									ClearLocalData(persister);
									window.location.reload();
								},
								});
							}}/>
						</Row>
					</Fragment>}
			</Column>
		);
	}
}

export function ShowChangeDisplayNameDialog(userID: string, oldDisplayName: string) {
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
