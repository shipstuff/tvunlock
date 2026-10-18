import {render} from 'preact';
import {App} from './app';
import {applyTokens} from './theme/tokens';
import './theme/global.css';

applyTokens();
render(<App />, document.getElementById('root')!);
