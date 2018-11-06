import {Component} from 'react';

export function HasSealedProps(target: Object) {
	let oldConstructor = target.constructor;
	target.constructor = function() {
		for (let key in target['prototype']) {
			let method = target['prototype'][key];
			if (method.sealed && this[key] != method) {
				throw new Error(`Cannot override sealed method '${key}'.`);
			}
		}
		return oldConstructor.apply(this, arguments);
	};
}
export function Sealed(target: Object, key: string) {
	target[key].sealed = true;
}

@HasSealedProps
export class BaseComponent<P, S> extends Component<P, S> {
	ComponentWillMount(): void {};
	ComponentWillMountOrReceiveProps(newProps: any, forMount?: boolean): void {};
	@Sealed componentWillMount() {
		this.ComponentWillMount(); 
		this.ComponentWillMountOrReceiveProps(this.props, true);
	}

	ComponentDidMount(...args: any[]): void {};
	ComponentDidMountOrUpdate(lastProps?: Readonly<P & {children?}>, lastState?: S): void {};
	ComponentDidMountOrUpdate_lastProps: Readonly<P & {children?}>;
	ComponentDidMountOrUpdate_lastState: S;

	mounted = false;
	@Sealed componentDidMount(...args) {
		this.ComponentDidMount(...args);
		this.ComponentDidMountOrUpdate(this.ComponentDidMountOrUpdate_lastProps, this.ComponentDidMountOrUpdate_lastState);
		this.ComponentDidMountOrUpdate_lastProps = this.props as any;
		this.ComponentDidMountOrUpdate_lastState = this.state;
		this.mounted = true;
		this.CallPostRender();
	}

	ComponentWillUnmount(): void {};
	@Sealed componentWillUnmount() {
		this.ComponentWillUnmount();
		this.mounted = false;
	}
	
	ComponentWillReceiveProps(newProps: any[]): void {};
	@Sealed componentWillReceiveProps(newProps) {
		this.ComponentWillReceiveProps(newProps);
		this.ComponentWillMountOrReceiveProps(newProps, false);
	}
	ComponentDidUpdate(...args: any[]): void {};
	@Sealed componentDidUpdate(...args) {
	   this.ComponentDidUpdate(...args);
		this.ComponentDidMountOrUpdate(this.ComponentDidMountOrUpdate_lastProps, this.ComponentDidMountOrUpdate_lastState);
		this.ComponentDidMountOrUpdate_lastProps = this.props as any;
		this.ComponentDidMountOrUpdate_lastState = this.state;
		this.CallPostRender();
	}

	private CallPostRender() {
		if (this.PostRender == BaseComponent.prototype.PostRender) return;

		let ownPostRender = this.PostRender as any;
		// can be different, for wrapped components (apparently they copy the inner type's PostRender as their own PostRender -- except as a new function, for some reason)
		let prototypePostRender = this.constructor.prototype.PostRender;
		if (ownPostRender.instant || prototypePostRender.instant) {
			this.PostRender();
		} else {
			setTimeout(()=>window.requestAnimationFrame(()=> {
				if (!this.mounted) return;
				this.PostRender();
			}));
		}
	}

	PreRender(): void {};
	PostRender(): void {};
}