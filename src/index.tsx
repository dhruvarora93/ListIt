/* @refresh reload */
import 'solid-devtools';
import './index.css';

import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { lazy } from 'solid-js';

import App from './app';
import Home from './pages/Home';

const Search = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ListDetail = lazy(() => import('./pages/ListDetail'));
const CreateList = lazy(() => import('./pages/CreateList'));
const RemixList = lazy(() => import('./pages/RemixList'));
const NotFound = lazy(() => import('./errors/404'));

const root = document.getElementById('root');

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/profile" component={Profile} />
      <Route path="/user/:handle" component={UserProfile} />
      <Route path="/list/:id" component={ListDetail} />
      <Route path="/create" component={CreateList} />
      <Route path="/remix/:id" component={RemixList} />
      <Route path="*404" component={NotFound} />
    </Router>
  ),
  root!,
);
