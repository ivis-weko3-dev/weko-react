import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React from "react";
import fetch from "unfetch";
import RangeFacet from "./components/RangeFacet";

//Get all labels.
const LABELS = {};
let labels = document.getElementsByClassName("body-facet-search-label");
for (let i = 0; i < labels.length; i++) {
  LABELS[labels[i].id] = labels[i].value;
}

class FacetSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      is_enable: true,
      list_title: {},
      list_facet: {},
    };
    this.getTitle = this.getTitle.bind(this);
    this.get_facet_search_list = this.get_facet_search_list.bind(this);
    this.convertData = this.convertData.bind(this);
    this.getUrlVars = this.getUrlVars.bind(this);
  }

  getTitle() {
    let titleLst = {};
    fetch("/facet-search/get-title-and-order", { method: "POST" })
      .then((r) => r.json())
      .then((response) => {
        if (response.status) {
          titleLst = response.data.titles;
        }
        this.setState({ list_title: titleLst });
      });
  }

  get_facet_search_list() {
    let search = window.location.search;
    let url = "/api/records/";
    let params = this.getUrlVars();
    if (params.search_type && String(params.search_type) === "2") {
      url = "/api/index/";
    }
    fetch(url + search)
      .then((r) => r.json())
      .then((res) => {
        if (params.search_type && String(params.search_type) === "2") {
          // Index faceted search
          const data =
            res &&
              res.aggregations &&
              res.aggregations.path &&
              res.aggregations.path.buckets &&
              res.aggregations.path.buckets[0]
              ? res.aggregations.path.buckets[0]
              : {};
          this.convertData(data && data[0] ? data[0] : {});
        } else {
          // default faceted search
          this.convertData(res && res.aggregations ? res.aggregations : {});
        }
      });
  }

  getUrlVars() {
    let vars = {};
    let pattern = /[?&]+([^=&]+)=([^&]*)/gi;
    window.location.href.replace(pattern, function (m, key, value) {
      vars[key] = value;
    });
    return vars;
  }

  convertData(data) {
    let list_facet = {};
    if (data) {
      Object.keys(data).map(function (name, k) {
        let val = data[name][name] ? data[name][name] : data[name];
        let hasBuckets = val["key"] && val["key"].hasOwnProperty("buckets");
        hasBuckets = val.hasOwnProperty("buckets") || hasBuckets;
        if (hasBuckets) {
          list_facet[name] = val[name] ? val[name] : val;
          //START:temporary fix for JDCat
          if (name != "Temporal" && name != "Data Language" && name != "Access") {
            let e = document.getElementById('lang-code');
            let l = e.options[e.selectedIndex].value;
            let tmp = list_facet[name];

            for (let i = 0; i < tmp.buckets.length; i++) {
              let a = tmp.buckets[i];

              if ((l == "en") && ((a.key).charCodeAt(0) > 256 || (a.key).charCodeAt(a.key.length - 1) > 256)) {
                delete list_facet[name].buckets[i];
              } else if ((l != "en") && ((a.key).charCodeAt(0) < 256 && (a.key).charCodeAt(a.key.length - 1) < 256)) {
                delete list_facet[name].buckets[i];
              }
            }
          }
          if (name == "Access"){
            let tmp = list_facet[name];

            for (let i = 0; i < tmp.buckets.length; i++) {
              let a = tmp.buckets[i];

              if (((a.key).charCodeAt(0) > 256 || (a.key).charCodeAt(a.key.length - 1) > 256)) {
                delete list_facet[name].buckets[i];
              } 
            }
          }
          //END:temporary fix for JDCat
        }

      });
    }
    this.setState({ list_facet: list_facet });
  }

  componentDidMount() {
    this.getTitle();
    this.get_facet_search_list();
  }

  render() {
    const { is_enable, list_title, list_facet } = this.state;
    return (
      <div>
        {is_enable && (
          <div className="facet-search break-word">
            {Object.keys(list_facet).map(function (name, key) {
              const item = list_facet[name];
              const nameshow = list_title[name];
              return (
                <RangeFacet item={item} nameshow={nameshow} name={name} key={key} labels={LABELS} />
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

export default FacetSearch;
