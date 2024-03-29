import { React, useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import db from "../config";
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass =
  // eslint-disable-next-line import/no-webpack-loader-syntax
  require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

mapboxgl.accessToken = process.env.REACT_APP_TOKEN;

const ClickCounterMap = () => {
  const [clickCount, setClickCount] = useState(0);
  const [clickedLocations, setClickedLocations] = useState([]);
  const [locationCounts, setLocationCounts] = useState({});
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [map, setMap] = useState(null);
  const mapContainer = useRef(null);

  useEffect(() => {
    // Fetch previous total counts from firebase database
    db.collection("clicks")
      .doc("total")
      .get()
      .then((doc) => {
        if (doc.exists) {
          setClickCount(doc.data().count);
        }
      });
    // Fetch previous clicked locations from Firebase database
    db.collection("clicks")
      .get()
      .then((querySnapshot) => {
        const locations = [];
        querySnapshot.forEach((doc) => {
          locations.push(doc.data());
        });
        setClickedLocations(locations);
      });
    // Fetch previous locationCount from firebase database
    db.collection("locationCounts")
      .get()
      .then((querySnapshot) => {
        const locationCounts = {};
        querySnapshot.forEach((doc) => {
          locationCounts[doc.id] = doc.data().locationCount;
        });
        setLocationCounts(locationCounts);
      });

    // Render a map from Mapbox
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [0, 0],
      zoom: "2",
      bearing: 29,
      pitch: 30,
    });
    setMap(map);

    // Add navigation control (the +/- zoom buttons)
    map.addControl(new mapboxgl.NavigationControl());
  }, []);

  const handleButtonClick = () => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    // send the count to firebase
    db.collection("clicks").doc("total").set({
      count: newClickCount,
    });
    // Get the lng & lat from navigator.geo.location
    navigator.geolocation.getCurrentPosition((position) => {
      const { longitude, latitude } = position.coords;
      // Store the result in a new variable 'location'
      const location = {
        lng: longitude,
        lat: latitude,
      };
      // Get the clicked location state and country
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}`
      )
        .then((response) => response.json())
        .then((data) => {
          const state = data.features.find(
            (feature) => feature.place_type[0] === "region"
          ).text;
          const country = data.features.find(
            (feature) => feature.place_type[0] === "country"
          ).text;
          setState(state);
          setCountry(country);
          // create a key that combines the state and country values
          const locationKey = `${state}-${country}`;
          // check if the location already exists in the locationCounts dictionary
          if (locationKey in locationCounts) {
            // if it does, increment the count by 1
            const newCount = locationCounts[locationKey] + 1;
            // update the locationCounts dictionary
            setLocationCounts((prevLocationCounts) => {
              return {
                ...prevLocationCounts,
                [locationKey]: newCount,
              };
            });
          } else {
            // if it doesn't, set the count to 1
            setLocationCounts((prevLocationCounts) => {
              return {
                ...prevLocationCounts,
                [locationKey]: 1,
              };
            });
          }

          // send the locationCounts dictionary to firebase
          db.collection("locationCounts").doc(locationKey).set({
            locationCount: locationCounts[locationKey],
          });

          // Create a copy by spreading the initial state(state is an array) into a new array
          const newClickedLocations = [...clickedLocations];
          // Send the object to firebase database
          db.collection("clicks")
            .add({
              location,
              state,
              country,
            })
            .then((docRef) => {
              // Add the new location to the state
              newClickedLocations.push({
                id: docRef.id,
                ...location,
                state,
                country,
              });
              setClickedLocations(newClickedLocations);
            });

          // move the map to the clicked location
          map.flyTo({
            center: [longitude, latitude],
            zoom: 10,
          });
          // add a marker to the map
          new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);
          // popup
          new mapboxgl.Popup()
            .setLngLat([longitude, latitude])
            .setHTML(`<p>You clicked in ${state}, ${country}</p>`)
            .addTo(map);
        });
    });
  };

  // handle reset
  // const handleReset = () => {
    // reset the count to 0
  //   setClickCount(0);
    // reset the locationCounts dictionary to empty
  //   setLocationCounts({});
    // reset the clickedLocations array to empty
  //   setClickedLocations([]);
    // reset the state and country to empty
  //   setState("");
  //   setCountry("");
    // send the count to firebase
  //   db.collection("clicks")
  //     .doc("total")
  //     .set({
  //       count: 0,
  //     })
  //     .then(() => {
  //       console.log("Total count successfully written!");
  //     })
  //     .catch((error) => {
  //       console.error("Error writing Total count: ", error);
  //     });
    // send the locationCounts dictionary to firebase
  //   db.collection("locationCounts")
  //     .get()
  //     .then((querySnapshot) => {
  //       querySnapshot.forEach((doc) => {
  //         db.collection("locationCounts")
  //           .doc(doc.id)
  //           .delete()
  //           .then(() => {
  //             console.log("Location Count successfully deleted!");
  //           })
  //           .catch((error) => {
  //             console.error("Error deleting Location Count: ", error);
  //           });
  //       });
  //     });
    // send the clickedLocations array to firebase
  //   db.collection("clicks")
  //     .get()
  //     .then((querySnapshot) => {
  //       querySnapshot.forEach((doc) => {
  //         db.collection("clicks")
  //           .doc(doc.id)
  //           .delete()
  //           .then(() => {
  //             console.log("Clicked Location successfully deleted!");
  //           })
  //           .catch((error) => {
  //             console.error("Error deleting Clicked Location: ", error);
  //           });
  //       });
  //     });
  // };

  return (
    <div className="click">
      <h1 className="click--title">Chasing D clicks</h1>
      {/* <button onClick={handleReset} className="click--reset">
        Reset
      </button> */}
      <p className="click--text">
      I have been clicked{" "}
        <strong className="click--text__count">{clickCount}</strong> times
      </p>
      <p className="click--text">
        I have been clicked from{" "}
        <strong className="click--text__count">
          {Object.keys(locationCounts).length}
        </strong>{" "}
        different locations
      </p>
      {state && country && (
        <p className="click--text">
         You clicked from{" "}
          <strong className="click--text__location">
            {state}, {country}
          </strong>
        </p>
      )}
      <button onClick={handleButtonClick} className="click--btn">
        Click Me
      </button>
      <div className="click--map">
        <div
          ref={mapContainer}
          style={{ width: "100%", height: "100%", borderRadius: ".5rem" }}
        ></div>
      </div>
      <div className="click--locationCount">
        <h2 className="click--locationCount__head">Clicked Locations</h2>
        <ul className="click--locationCount__list">
          <li className="click--locationCount__list--container">
            <h2 className="click--locationCount__list--container__title">
              Locations
            </h2>
            <h2 className="click--locationCount__list--container__title">
              Clicks #
            </h2>
          </li>
          {Object.keys(locationCounts).map((key) => {
            const [state, country] = key.split("-");
            const count = locationCounts[key];
            return (
              <li key={key} className="click--locationCount__list__item">
                <p className="click--locationCount__list__item__location">
                  {state}, {country}
                </p>
                <p className="click--locationCount__list__item__count">
                  ({count})
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ClickCounterMap;
