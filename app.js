const bodyParser = require('body-parser');
const { render } = require('ejs');
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://karan:Test1234@cluster0.2v6wbpy.mongodb.net/todolistDB",{ useNewUrlParser: true,useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000});
const listsSchema =new mongoose.Schema({
    name:String
});

const Item = mongoose.model("item",listsSchema);
const item1 = new Item({
name :"welcometo your todolist!"
});
const item2 = new Item({
name :"hit the + button to add item"
});
const item3 = new Item({
name :"<-- hit this to delete the item"
});

const defaultItems = [item1,item2,item3];
const listSchema={
  name:String,
  items:[listsSchema]
};
const List=mongoose.model("List",listSchema);

app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  try {
      const existingList = await List.findOne({ name: customListName });
      if (existingList) {
          res.render("list", {
              listTitle: existingList.name,
              newListItems: existingList.items
          });
      } else {
          const list = new List({
              name: customListName,
              items: defaultItems
          });
          await list.save();
          res.redirect("/" + customListName);
      }
  } catch (err) {
      console.error("Error creating or retrieving custom list:", err);
      res.status(500).send("Internal Server Error");
  }
});

 app.get("/", async function(req, res) {
      try {
          const defaultItems = await Item.find({});
          if (defaultItems.length === 0) {
            await Item.insertMany(defaultItems)
            .then(docs => {
              console.log("Default items inserted successfully:", docs);
            })
            .catch(err => {
              console.error("Error inserting default items:", err);
            });
           } else {
          //     console.log("Default items already exist:", defaultItems);
          }
  
          res.render("list", {
              listTitle: "Today",
              newListItems: defaultItems
          });
      } catch (err) {
          console.error("Error retrieving default items:", err);
          res.status(500).send("Internal Server Error");
      }
  }); 
  app.post("/", async function(req, res) {
    let itemName = req.body.NewItem;
    let listName = req.body.list;
    try {
        const item = new Item({
            name: itemName
        });

        if (listName === "today"){
            await item.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({ name: listName });
            if (foundList) {
                foundList.items.push(item); 
                await foundList.save();
                res.redirect("/" + listName); 
            } else {
                console.log("List not found.");
                res.status(404).send("List not found");
            }
        }
     }     catch (err) {
           console.error("Error saving item:", err);
           res.status(500).send("Internal Server Error");
       }
    });

app.post("/delete", async function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    
    try {
        if (listName === "Today") {
            const deletedItem = await Item.findByIdAndRemove(checkedItemId);
            if (deletedItem) {
                console.log("Item deleted successfully");
                res.redirect("/");
            } else {
                console.log("Item not found");
                res.status(404).send("Item not found");
            }
        } else {
            const updatedList = await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: checkedItemId } } },
                { new: true }
                );
            if (updatedList) {
                console.log("Item deleted successfully");
                res.redirect("/" + listName);
            } else {
                console.log("List not found");
                res.status(404).send("List not found");
            }
        }
    } catch (err) {
        console.error("Error deleting item:", err);
        res.status(500).send("Internal Server Error: " + err.message);
    }
});

    

app.get("/about",function(req,res){
res.render("about");
});


app.listen(3000,function(req,res){
    console.log("connected to 3000 port");
    }); 
