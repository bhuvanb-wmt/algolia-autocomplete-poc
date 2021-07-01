import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { algoliaSDK } from "./lib/Algolia";
import Home from "./pages/home";
import PLP from "./pages/plp";

export default class App extends React.Component {
  componentDidMount() {
    algoliaSDK.setIndex();
  }
  render() {
    return (
      <Router>
        <div>
          {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
          <Switch>
            <Route path="/plp">
              <PLP />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </div>
      </Router>
    );
  }
}
