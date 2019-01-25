import { ApplyBasicStyles, BaseComponent, BasicStyles, SimpleShouldUpdate } from 'react-vextensions';
import { firebaseConnect, helpers } from 'react-redux-firebase';
import { Button, Div, Row } from 'react-vcomponents';
import SocialButton from "react-social-button";
import {Column} from "react-vcomponents";
import {E} from "js-vextensions";
import {ShowMessageBox, BoxController} from "react-vmessagebox";
import {Link} from "../../../Frame/ReactComponents/Link";
import {ACTSetPage, ACTTopRightOpenPanelSet} from "../../../Store/main";
import {IsAuthValid} from "Store/firebase";
import { State } from 'Frame/Store/StoreHelpers';
import {GetUserID} from "../../../Store/firebase/users";
import { HandleError } from '../../../Frame/General/Errors';
import { Connect } from '../../../Frame/Database/FirebaseConnect';

@Connect(state=>({
	// authError: pathToJS(state.firebase, "authError"),
	// auth: helpers.pathToJS(state.firebase, "auth"),
	auth: State(a=>a.firebase.auth),
	// account: helpers.pathToJS(state.firebase, "profile")
	}))
export default class UserPanel extends BaseComponent<{auth?}, {}> {
	render() {
		const { auth } = this.props;
		const firebase = store.firebase.helpers;
		if (!IsAuthValid(auth)) {
			return (
				<Column style={{ padding: 10, background: 'rgba(0,0,0,.7)', borderRadius: '0 0 0 5px' }}>
					<Div mt={-3} mb={5}>Takes under 30 seconds.</Div>
					<SignInPanel/>
				</Column>
			);
		}

		return (
			<Column style={{ padding: 5, background: 'rgba(0,0,0,.7)', borderRadius: '0 0 0 5px' }}>
				<Column sel>
					<div>Name: {auth.displayName}</div>
					<div>ID: {GetUserID()}</div>
				</Column>
				{/* DEV &&
					<Row>
						<CheckBox value={State().main.
					</Row> */}
				<Row mt={5}>
					<Link ml="auto" mr={5} actions={d => d(new ACTSetPage('profile'))} onContextMenu={e => e.nativeEvent['passThrough'] = true}>
						<Button text="Edit profile" style={{ width: 100 }} onClick={() => {
							store.dispatch(new ACTTopRightOpenPanelSet(null));
						}}/>
					</Link>
					<Button text="Sign out" style={{ width: 100 }} onClick={() => {
						firebase.logout();
					}}/>
				</Row>
			</Column>
		);
	}
}

export function ShowSignInPopup() {
	const boxController: BoxController = ShowMessageBox({
		title: 'Sign in', okButton: false, cancelOnOverlayClick: true,
		message: () => {
			return (
				<div>
					<div>Takes under 30 seconds.</div>
					<SignInPanel style={{ marginTop: 5 }} onSignIn={() => boxController.Close()}/>
				</div>
			);
		},
	});
}

@SimpleShouldUpdate
export class SignInPanel extends BaseComponent<{style?, onSignIn?: ()=>void}, {}> {
	render() {
		const { style, onSignIn } = this.props;
		return (
			<Column style={style}>
				<SignInButton provider="google" text="Sign in with Google" onSignIn={onSignIn}/>
				<SignInButton provider="facebook" text="Sign in with Facebook" mt={10} onSignIn={onSignIn}/>
				<SignInButton provider="twitter" text="Sign in with Twitter" mt={10} onSignIn={onSignIn}/>
				<SignInButton provider="github" text="Sign in with GitHub" mt={10} onSignIn={onSignIn}/>
			</Column>
		);
	}
}

@SimpleShouldUpdate
// @ApplyBasicStyles
class SignInButton extends BaseComponent<{provider: 'google' | 'facebook' | 'twitter' | 'github', text: string, style?, onSignIn?: ()=>void}, {loading: boolean}> {
	render() {
		const { provider, text, style, onSignIn } = this.props;
		const firebase = store.firebase.helpers;
		const { loading } = this.state;
		return (
			<SocialButton social={provider} text={text} loading={loading} btnProps={{
				style: E({ outline: 'none' }, BasicStyles(this.props), style),
				onClick: async () => {
					this.SetState({ loading: true });
					try {
						const account = await firebase.login({ provider, type: 'popup' });
						if (this.mounted == false) return;
						this.SetState({ loading: false });
						if (onSignIn) onSignIn();
					} catch (ex) {
						this.SetState({ loading: false });
						if (ex.message == 'This operation has been cancelled due to another conflicting popup being opened.') return;
						HandleError(ex);
					}
				},
			}}/>
		);
	}
}
