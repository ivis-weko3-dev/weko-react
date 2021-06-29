import "rc-slider/assets/index.css";
import "rc-tooltip/assets/bootstrap.css";
import React from "react";
import Select from "react-select";

function RangeSelect({ value, name, labels }) {
  function handleChange(params) {
    let searchUrl = "";
    if (search.indexOf("&") >= 0) {
      let arrSearch = search.split("&");
      for (let i = 0; i < arrSearch.length; i++) {
        if (arrSearch[i].indexOf(encodeURIComponent(name) + "=") < 0) {
          searchUrl += "&" + arrSearch[i];
        }
      }
      //Delete "&" in First element
      searchUrl = searchUrl.substring(1);
    }
    if (searchUrl != "") {
      search = searchUrl;
    }
    params.map(function (subitem, k) {
      const pattern =
        encodeURIComponent(name) + "=" + encodeURIComponent(subitem.value);
      search += "&" + pattern;
    });
    window.location.href = "/search" + search;
  }

  let search = window.location.search.replace(",", "%2C") || "?";
  let options_default = [];
  let options = [];
  if (value) {
    value.map(function (subitem, k) {
      let option = { label: "", value: "" };
      const pattern =
        encodeURIComponent(name) + "=" + encodeURIComponent(subitem.key);
      const is_check = search.indexOf(pattern + "&") >= 0 ? true : false;
      const is_end = search.endsWith(pattern);
      option.label =
        (labels[subitem.key] || subitem.key) + "(" + subitem.doc_count + ")";
      option.value = subitem.key;
      options.push(option);
      if (is_check || is_end) {
        options_default.push(option);
      }
    });
  }
  return (
    <div>
      <div className="select-container">
        <Select
          defaultValue={options_default}
          isMulti
          name="Facet_Search"
          ontrolShouldRenderValue={false} 
          onChange={(_selectedOption) => {
            handleChange(_selectedOption);
          }}
          backspaceRemovesValue={false}
          isClearable={false}
          options={options}
          className="basic-multi-select"
          classNamePrefix="select"
        />
      </div>
    </div>
  );
}

export default RangeSelect;
